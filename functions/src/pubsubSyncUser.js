const _ = require("lodash");
const axios = require("axios");
const querystring = require("querystring");
const { db, rollbar } = require("./admin");
const moment = require("moment-timezone");
const uuidv4 = require("uuid/v4");

async function loadUserData(todoistUid) {
    const userQuery = db.collection("users")
        .where("todoistUserId", "==", todoistUid);
    try {
        const userSnapshot = await userQuery.get();
        const settingsObj = userSnapshot.docs[0].data();
        settingsObj.doc_id = userSnapshot.docs[0].id;
        return settingsObj;
    } catch(err) {
        rollbar.error(err);
    }
}

async function getTodoistSync(userData) {
    const token = _.get(userData, "oauthToken");
    const syncToken = _.get(userData, "syncToken") || "*";
    const resourceTypes = '["items"]';
    const url = "https://api.todoist.com/sync/v8/sync";
    if (!token) {
        throw new Error("No auth token");
    }
    // make api request
    const data = {
        token,
        sync_token: syncToken,
        resource_types: resourceTypes,
    };
    const response = await axios.post(url, querystring.stringify(data));
    return response.data;
}

async function escalateTodoistTask({ oauthToken, todoistTaskData }) {
    const uuid = uuidv4();
    if (!oauthToken) {
        throw new Error("Missing params");
    }
    const oldPriority = Number(todoistTaskData.priority);
    if (oldPriority === 4) return;
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
    console.log(`Escalated Todoist task`)
    return;
}

// filter no due date and recurring tasks
// should we filter out completed tasks we don't need to store all that
function filterTasks(items) {
    return items.filter(item => {
        if (!_.get(item, "due")) return false;
        if (_.get(item, "due.is_recurring")) return false;
        if (_.get(item, "checked")) return false;
        return true;   // CHANGE to true to go live
    })
}

// return task document or empty document if none exists
async function loadTaskDB({ userId, taskId}) {
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
    
}

function formatTodoistTaskData(item) {
    const taskId = _.get(item, "id");
    const content = _.get(item, "content");
    const priority = _.get(item, "priority");
    const date = _.get(item, "due.date");
    const tz = _.get(item, "due.timezone");
    const due_date_utc = moment.tz(date, tz).utc().format();
    if (!content || !priority || !date) {
        throw new Error("Missing params");
    }
    return {
        content,
        due_date_utc,
        priority,
        taskId
    };
}

function determineActionNeeded({ escalatorTaskData, todoistTaskData, userData }) {
    // if priority changed, just update task
    if (escalatorTaskData.current_priority !== todoistTaskData.priority) return "UPDATE";
    // compare dates
    const priority = _.get(todoistTaskData, "priority");
    const escalationDays = userData[`p${5 - priority}Days`];
    if (!escalationDays) return "UPDATE";
    const escalationMs = escalationDays * 24 * 60 * 60 * 1000;
    const incomingDueDate = new Date(todoistTaskData.due_date_utc);
    const escalatorDueDate = new Date(escalatorTaskData.current_due_date_utc);
    if ((incomingDueDate.getTime() - escalatorDueDate.getTime()) > escalationMs) {
        return "ESCALATE";
    }
    return "UPDATE";
}

async function addEscalatedTask({ todoistTaskData, userData }) {
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
        .doc(userData.doc_id)
        .collection("escalatedTasks")
        .doc(String(timestamp))
        .set(dataToSave);
    console.log(`Add FS escalated task ${timestamp} for user ${userData.doc_id}`);
}

async function updateFirestoreTask({ escalatorTaskData, todoistTaskData, userData, action }) {
    const escalate = action === "ESCALATE";
    const escalatorPriority = Number(_.get(escalatorTaskData, "current_priority", 999));
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
    const dataToSave = {
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
        .doc(String(userData.doc_id))
        .collection("trackedTasks")
        .doc(String(todoistTaskData.taskId))
        .set(dataToSave, { merge: true });
    console.log(`Update FS task ${todoistTaskData.taskId} for user ${userData.doc_id}`);
    return;
}

async function handleSingleTask(item, userData) {
    console.log({
        ...item,
        location: "top of handleSingleTask"
    });
    // load from database
    const dbInfo = {
        userId: userData.doc_id,
        taskId: item.id
    };
    const escalatorTaskData = await loadTaskDB(dbInfo);
    // format incoming data
    const todoistTaskData = formatTodoistTaskData(item);
    // compare and determine course of action
    const action = determineActionNeeded({ escalatorTaskData, todoistTaskData, userData });
    // if escalate, update todoist
    if (action === "ESCALATE") {
        const escalateInfo = {
            oauthToken: userData.oauthToken,
        };
        await escalateTodoistTask(escalateInfo);
    }
    // update firestore with new info
    if (["ESCALATE", "UPDATE"].includes(action)) {
        await updateFirestoreTask({ escalatorTaskData, todoistTaskData, userData });
    }
    if (action === "ESCALATE") {
        await addEscalatedTask({ todoistTaskData, userData });
    }
    // we made it
    return;
}

async function updateSyncToken({ userDocId, newSyncToken }) {
    await db
        .collection("users")
        .doc(String(userDocId))
        .set({ syncToken: newSyncToken }, { merge: true });
    console.log(`Updated sync token for user ${userDocId}`);
    return;
}

async function processTaskUpdates(todoistData, userData) {
    const items = _.get(todoistData, "items") || [];
    const filteredItems = filterTasks(items);
    if (_.isEmpty(filteredItems)) {
        return;
    }
    // if promise all is successful, update syncToken and done
    await Promise.all(
        filteredItems.map(item => handleSingleTask(item, userData))
    );
    // update syncToken here
    const input = {
        userDocId: userData.doc_id,
        newSyncToken: todoistData.sync_token,
    };
    await updateSyncToken(input);
    return;
}

async function pubsubSyncUser(message) {
    // get todoist id
    const data = JSON.parse(Buffer.from(message.data, "base64").toString("utf-8")) || {};
    const todoistUid = _.get(data, "todoistId");
    if (!todoistUid) return null;
    // find and load user data from db
    const userData = await loadUserData(todoistUid);
    // get changes from todoist
    const todoistData = await getTodoistSync(userData);
    // process todoist changes
    await processTaskUpdates(todoistData, userData);
    return null;
}

module.exports = pubsubSyncUser;