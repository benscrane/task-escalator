import axios from 'axios';
import * as _ from 'lodash';
import { DateTime } from 'luxon';
import * as querystring from 'querystring';
import { v4 as uuidv4 } from 'uuid';
import { db, rollbar } from './admin';
import {
    PubsubMessageData,
    TaskActionInfo,
    Taskalator,
    TempTask,
    Todoist,
    UserPubSubMessage,
} from './types';

// tslint:disable:no-any

export const pubsubSyncUser = async (message: UserPubSubMessage) => {
    // get todoist id
    const data: PubsubMessageData = JSON.parse(Buffer.from(message.data, 'base64').toString('utf-8')) || {};
    const todoistUid = data.todoistId;
    if (!todoistUid) return null;
    // find and load user data from db
    const userData: Taskalator.User = await loadUserData(todoistUid);
    // get changes from todoist
    const todoistData: Todoist.SyncResponse = await getTodoistSync(userData);
    // process todoist changes
    await processTaskUpdates(todoistData, userData);
    return null;
};

export const loadUserData = async (todoistUid: string): Promise<Taskalator.User> => {
    const userQuery = db.collection('users')
        .where('todoistUserId', '==', todoistUid);

    try {
        const userSnapshot = await userQuery.get();
        const settingsObj: Taskalator.User = userSnapshot.docs[0].data();
        settingsObj.doc_id = userSnapshot.docs[0].id;
        return settingsObj;
    } catch (err) {
        rollbar.error(err);
        throw new Error(err);
    }
};

export const getTodoistSync = async (userData: Taskalator.User): Promise<Todoist.SyncResponse> => {
    const token: string | undefined = _.get(userData, 'oauthToken');
    if (!token) {
        throw new Error('No auth token');
    }

    const syncToken: string = _.get(userData, 'syncToken', '*');
    const resourceTypes: string = '["items"]';
    const url: string = 'https://api.todoist.com/sync/v8/sync';

    // make api request
    const data = {
        token,
        sync_token: syncToken,
        resource_types: resourceTypes,
    };
    const response = await axios.post(url, querystring.stringify(data));
    return response.data;
};

export const escalateTodoistTask = async ({ oauthToken, todoistTaskData }: TaskActionInfo) => {
    const uuid = uuidv4();
    if (!oauthToken) {
        throw new Error('Missing oauth token');
    }
    const oldPriority = Number(todoistTaskData.priority);
    if (oldPriority === 4) {
        return;
    }
    const commands = [{
        type: "item_update",
        uuid,
        args: {
            id: todoistTaskData.taskId,
            priority: oldPriority + 1
        }
    }];
    const url = "https://api.todoist.com/sync/v8/sync";
    const data = {
        token: oauthToken,
        commands: JSON.stringify(commands),
    };
    await axios.post(url, querystring.stringify(data));
    return;
};

export const filterTasks = (items: TempTask[]): TempTask[] => {
    return items.filter((item: TempTask) => {
        if (!_.get(item, "due")) return false;
        if (_.get(item, "due.is_recurring")) return false;
        if (_.get(item, "checked")) return false;
        return true;
    });
};

// return task document or empty document if none exists
export const loadTaskalatorTask = async ({ userId, taskId}: any) => {
    const taskRef = db
        .collection("users")
        .doc(userId)
        .collection("trackedTasks")
        .doc(String(taskId));
    const taskDoc = await taskRef.get();
    if (taskDoc.exists) {
        return taskDoc.data();
    } else {
        return {};
    }
};

export const formatTodoistTask = (item: TempTask): Todoist.Task => {
    const taskId = _.get(item, "id");
    const content = _.get(item, "content");
    const priority: number = Number.parseInt(_.get(item, 'priority', ''), 10);
    const date = _.get(item, "due.date");
    const due_date_utc = DateTime.fromISO(date, { zone: 'utc' }).toISO();
    if (!content || !priority || !date) {
        throw new Error("Missing params");
    }
    return {
        content,
        due_date_utc,
        priority,
        taskId
    };
};

export interface DetermineActionNeededInfo {
    taskalatorTask: Taskalator.Task;
    todoistTask: Todoist.Task;
    user: Taskalator.User;
}

export const determineActionNeeded = ({ taskalatorTask, todoistTask, user }: DetermineActionNeededInfo): Taskalator.Action => {
    // new priority set by user
    if (taskalatorTask.current_priority !== todoistTask.priority) {
        return 'UPDATE';
    }

    const priority = _.get(todoistTask, 'priority');
    const escalationDays = _.get(user, `p${5 - priority}Days`);

    // user doesn't want to escalate these tasks
    if (!escalationDays) {
        return 'UPDATE';
    }

    const escalationMs = escalationDays * 24 * 60 * 60 * 1000;
    const incomingDueDate = new Date(todoistTask.due_date_utc);
    const taskalatorDueDate = new Date(taskalatorTask.current_due_date_utc!);    // TODO: should we be overriding this?

    if ((incomingDueDate.getTime() - taskalatorDueDate.getTime()) >= escalationMs) {
        return 'ESCALATE';
    }

    return 'UPDATE';
};

export const addEscalatedTask = async ({ todoistTaskData, userData }: TaskActionInfo) => {
    const userDocId = _.get(userData, 'doc_id');
    if (!userData || !userDocId) {
        throw new Error('Missing user document ID');
    }
    // content, previous_priority, new_priority, tracked_task_id
    const dataToSave = {
        content: todoistTaskData.content,
        previous_priority: todoistTaskData.priority,
        new_priority: todoistTaskData.priority === 4 ? 4 : todoistTaskData.priority + 1,
        tracked_task_id: todoistTaskData.taskId
    };
    const timestamp = new Date().getTime();
    await db
        .collection("users")
        .doc(userDocId)
        .collection("escalatedTasks")
        .doc(String(timestamp))
        .set(dataToSave);
    console.log(`Add FS escalated task ${timestamp} for user ${userData.doc_id}`);
};

async function updateFirestoreTask({ taskalatorTaskData, todoistTaskData, userData, action }: TaskActionInfo) {
    const escalate = action === "ESCALATE";
    const escalatorPriority = Number(_.get(taskalatorTaskData, "current_priority", 999));
    const todoistPriority = Number(_.get(todoistTaskData, "priority", 888));
    if (todoistPriority === 888) throw new Error("updateFirestoreTask: Bad todoist data");
    // content and due date always come from todoist
    const content = todoistTaskData.content;
    const current_due_date_utc = todoistTaskData.due_date_utc;
    // priority depends on if we're escalating or not
    const current_priority =
        (escalate && todoistTaskData.priority !== 4)
        ? todoistTaskData.priority + 1
        : todoistTaskData.priority;
    const dataToSave: any = {
        content,
        current_due_date_utc,
        current_priority,
    };
    // original_due_date_utc if we're escalating or the object is new
    const priorityChanging = escalatorPriority !== todoistPriority;
    const newTask = escalatorPriority === 999;
    if (priorityChanging || newTask || escalate) {
        dataToSave.original_due_date_utc = todoistTaskData.due_date_utc;
    }
    await db
        .collection("users")
        .doc(String(userData!.doc_id))
        .collection("trackedTasks")
        .doc(String(todoistTaskData.taskId))
        .set(dataToSave, { merge: true });
    // console.log(`Update FS task ${todoistTaskData.taskId} for user ${userData.doc_id}`);
    return;
}

async function handleSingleTask(item: TempTask, userData: Taskalator.User) {
    // load from database
    const dbInfo = {
        userId: userData.doc_id,
        taskId: item.id
    };
    const taskalatorTask: any = await loadTaskalatorTask(dbInfo);
    // format incoming data
    const todoistTask = formatTodoistTask(item);
    // compare and determine course of action
    const action = determineActionNeeded({ taskalatorTask, todoistTask, user: userData });
    // if escalate, update todoist
    if (action === "ESCALATE") {
        const escalateInfo = {
            oauthToken: userData.oauthToken,
            todoistTaskData: todoistTask
        };
        await escalateTodoistTask(escalateInfo);
    }
    // update firestore with new info
    if (["ESCALATE", "UPDATE"].includes(action)) {
        await updateFirestoreTask({ taskalatorTaskData: taskalatorTask, todoistTaskData: todoistTask, userData });
    }
    if (action === "ESCALATE") {
        await addEscalatedTask({ todoistTaskData: todoistTask, userData });
    }
    // we made it
    return;
}

export const updateSyncToken = async ({ userDocId, newSyncToken }: any) => {
    await db
        .collection("users")
        .doc(String(userDocId))
        .set({ syncToken: newSyncToken }, { merge: true });
};

async function processTaskUpdates(todoistData: Todoist.SyncResponse, userData: Taskalator.User) {
    const items = _.get(todoistData, "items", []);
    const filteredItems = filterTasks(items);
    if (_.isEmpty(filteredItems)) {
        return;
    }
    // if promise all is successful, update syncToken and done
    await Promise.all(
        filteredItems.map((item: any) => handleSingleTask(item, userData))
    );

    const input = {
        userDocId: userData.doc_id,
        newSyncToken: todoistData.sync_token,
    };
    await updateSyncToken(input);
    return;
}
