const { db, rollbar } = require("./admin.js");
const request = require("request");
const uuidv4 = require("uuid/v4");
const _ = require("lodash");
const moment = require("moment-timezone");
const { PubSub } = require("@google-cloud/pubsub");

const pubsub = new PubSub();

/**
 * Summary. Filters incoming event data from todoist webhooks
 * Description. Filters out events that are not item:added or item:updated
 * @param  {object} eventData  Object containing the incoming event data to evaluate
 * @returns {boolean} True if the task should be filtered out, false if the task should be evaluated further
 */
function filterOutTask(eventData) {
  // rollbar.info(eventData);
  // check event type, filter out anything that's not added or updated
  const eventName = _.get(eventData, "event_name");
  if (!["item:updated", "item:added"].includes(eventName)) {
    return true;
  }
  // filter out tasks with no due date
  const dueData = _.get(eventData, "event_data.due") || {};
  const dueDate = _.get(dueData, "date") || null;
  if (dueDate === null) {
    return true;
  }
  // filter out recurring tasks, for now just look for "every" in the date string
  const recurring = _.get(dueData, "is_recurring") || false;
  if (recurring) {
    return true;
  }
  // passed all checks, don't filter
  return false;
}

/**
 * Summary. Loads the user's settings document given a todoist user ID
 * @param  {number} todoistUserId User ID from todoist
 * @returns {object} The user's task escalator settings
 */
function loadUserData(todoistUserId) {
  var userQuery = db
    .collection("users")
    .where("todoistUserId", "==", todoistUserId)
    .get();
  var userSettings = userQuery
    .then(querySnapshot => {
      var settingsObj = querySnapshot.docs[0].data();
      settingsObj.doc_id = querySnapshot.docs[0].id;
      // console.log(settingsObj);
      return settingsObj;
    })
    .catch(error => {
      rollbar.error(error);
    });
  return userSettings;
}

/**
 * Summary. Returns the necessary action based on user settings and incoming task data
 * @param  {object} event_data
 * @param  {object} user_settings
 * @returns {string}  "ADD_TASK", "UPDATE_TASK", or "ESCALATE_TASK"
 */
function determineActionNeeded(event_data, user_settings) { // tslint:disable-line
  // determine if task exists as a tracked task
  var taskDocumentSnapshot = null;
  var shouldTaskAddPromise = loadTask(
    event_data.event_data.id,
    user_settings.doc_id
  )
    .then(taskDocSnapshot => {
      if (!taskDocSnapshot.exists) {
        return "ADD_TASK";
      } else {
        // existing document exists, determine next action
        taskDocumentSnapshot = taskDocSnapshot;
        return "CONTINUE_EVALUATION";
      }
    })
    .catch(error => {
      rollbar.error(error);
    });
  var shouldTaskEscalatePromise = shouldTaskAddPromise
    .then(actionNeeded => {
      if (actionNeeded === "ADD_TASK") {
        return actionNeeded;
      } else {
        return shouldTaskEscalate(
          event_data,
          user_settings,
          taskDocumentSnapshot
        );
      }
    })
    .catch(error => {
      rollbar.error(error);
    });
  var shouldTaskUpdatePromise = shouldTaskEscalatePromise
    .then(actionNeeded => {
      if (actionNeeded === "ADD_TASK" || actionNeeded === "ESCALATE_TASK") {
        return actionNeeded;
      } else {
        return shouldTaskUpdate(event_data, taskDocumentSnapshot);
      }
    })
    .catch(error => {
      rollbar.error(error);
    });
  return shouldTaskUpdatePromise;
}

/**
 * Summary. Determines if a task should be updated in the tracked tasks database
 * @param  {object} event_data
 * @param  {documentSnapshot} taskDocSnapshot
 * @returns {string} UPDATE_TASK if the task should be updated, NO_ACTION if not
 */
function shouldTaskUpdate(event_data, taskDocSnapshot) {  // tslint:disable-line
  var taskDocData = taskDocSnapshot.data();
  if (event_data.event_data.priority !== taskDocData.current_priority) {
    return "UPDATE_TASK";
  }
  if (event_data.event_data.content !== taskDocData.content) {
    return "UPDATE_TASK";
  }
  const date =  _.get(event_data, "event_data.due.date");
  const tz = _.get(event_data, "event_data.due.timezone");
  if (moment.tz(date, tz).utc().format() !== taskDocData.current_due_date_utc) {
    return "UPDATE_TASK";
  }
  return "NO_ACTION";
}

/**
 * Summary. Determines if an incoming task should be escalated
 * @param  {object} event_data
 * @param  {object} user_settings
 * @param  {documentSnapshot} taskDocSnapshot
 * @returns {boolean} True if task should be escalated, false if not
 */
function shouldTaskEscalate(event_data, user_settings, taskDocSnapshot) { // tslint:disable-line
  // can't escalate if it's already top priority
  if (event_data.event_data.priority === 4) {
    return "CONTINUE_EVALUATION";
  }
  // check if priority is unchanged
  var taskDocData = taskDocSnapshot.data();
  if (taskDocData.current_priority === event_data.event_data.priority) {
    // priorities match
    const date = _.get(event_data, "event_data.due.date");
    const tz = _.get(event_data, "event_data.due.timezone");
    var incomingDueDate = new Date(moment.tz(date, tz).utc().format());
    // console.log(`Incoming due date: ${incomingDueDate}`);
    var currentDueDate = new Date(taskDocData.current_due_date_utc);
    // console.log(`Current due date: ${currentDueDate}`);
    var daysBeforeEscalation =
      user_settings[`p${5 - event_data.event_data.priority}Days`];
    // console.log(`Days before escalation: ${daysBeforeEscalation}`);
    var dueDateDifference =
      incomingDueDate.getTime() - currentDueDate.getTime();
    // console.log(`Due date difference: ${dueDateDifference}`);
    var msBeforeEscalation = daysBeforeEscalation * 24 * 60 * 60 * 1000;
    // console.log(`MS difference: ${msBeforeEscalation}`);
    if (dueDateDifference > msBeforeEscalation) {
      return "ESCALATE_TASK";
    } else {
      return "CONTINUE_EVALUATION";
    }
  } else {
    // priorities don't match, escalation isn't appropriate
    return "CONTINUE_EVALUATION";
  }
}

/**
 * Summary. Loads a tracked task document
 * @param  {number} taskId  Todoist task ID
 * @param  {string} userUid Task escalator user ID
 * @returns {documentSnapshot} The tracked task document snapshot
 */
function loadTask(taskId, userUid) {
  return db
    .collection("users")
    .doc(userUid)
    .collection("trackedTasks")
    .doc(String(taskId))
    .get();
}

/**
 * Summary. Adds a task to the tracked tasks collection in a user document
 * Description. This can also handle updates
 * @param  {object} event_data  Incoming event data object
 * @param  {object} user_settings User settings object
 * @param  {string} action  Action to take, ADD_NEW or UPDATE_EXISTING
 */
function addTrackedTask(event_data, user_settings, action) {  // tslint:disable-line
  // console.log(event_data);
  // console.log(user_settings);
  // console.log(action);
  const content = _.get(event_data, "event_data.content");
  const currentPriority = _.get(event_data, "event_data.priority");
  var documentData = {
    content,
    current_priority: currentPriority,
  };
  const dateData = _.get(event_data, "event_data.due");
    const date = _.get(dateData, "date");
    const tz = _.get(dateData, "timezone");
  if (action === "ADD_NEW") {
    documentData.original_priority = currentPriority; // original and current priority are the same
    documentData.original_due_date_utc = moment.tz(date, tz).utc().format();
    documentData.current_due_date_utc = moment.tz(date, tz).utc().format();
  }
  if (action === "UPDATE_ESCALATED") {
    documentData.current_due_date_utc = moment.tz(date, tz).utc().format();
  }
  return db
    .collection("users")
    .doc(user_settings.doc_id)
    .collection("trackedTasks")
    .doc(String(event_data.event_data.id))
    .set(documentData, { merge: true });
}

/**
 * Summary. Adds an escalated task to the database
 * @param {object} event_data
 * @param {object} user_settings
 */
function addEscalatedTask(event_data, user_settings) {  // tslint:disable-line
  var documentData = {
    content: event_data.event_data.content,
    tracked_task_id: event_data.event_data.id,
    previous_priority: event_data.event_data.priority
  };
  var timestamp = new Date().getTime();
  var addEscalatedTaskPromise = db
    .collection("users")
    .doc(user_settings.doc_id)
    .collection("escalatedTasks")
    .doc(String(timestamp))
    .set(documentData, { merge: true });
  var updateEscalatedTaskPromise = addEscalatedTaskPromise
    .then(() => {
      event_data.event_data.priority = event_data.event_data.priority + 1;
      return addTrackedTask(event_data, user_settings, "UPDATE_ESCALATED");
    })
    .catch(error => {
      // console.log(error);
    });
  //TODO: increment the distributed counter here
  return updateEscalatedTaskPromise;
}

/**
 * @param  {object} event_data
 * @param  {object} user_settings
 */
function escalateTrackedTask(event_data, user_settings) { // tslint:disable-line
  var uuid = uuidv4();
  var commands = [
    {
      type: "item_update",
      uuid: uuid,
      args: {
        id: event_data.event_data.id,
        priority: event_data.event_data.priority + 1
      }
    }
  ];
  var commandString = JSON.stringify(commands);
  var options = {
    url: `https://todoist.com/api/v7/sync?token=${
      user_settings.oauthToken
    }&commands=${commandString}`,
    method: "POST"
  };
  request(options, (error, response, body) => {
    // console.log(response);
    // console.log(body);
    if (!error && response.statusCode === 200) {
      var syncBody = JSON.parse(body);
      if (syncBody.sync_status[uuid] === "ok") {
        // successful update
        return addEscalatedTask(event_data, user_settings);
      }
      return false;
    } else {
      // console.log(error);
      return false;
    }
  });
}

async function processTaskChanges(req, res) {
  const todoistId = _.get(req.body, "user_id");
  const topic = 'todoist-updates';
  if (!todoistId) {
    res.status(500).send();
  }
  const data = {
    todoistId
  };
  const dataBuffer = Buffer.from(JSON.stringify(data));
  try {
    await pubsub.topic(topic).publish(dataBuffer);
  } catch(error) {
    rollbar.error('Failed to publish user ID from task to pubsub', {
      error,
    });
  }
  res.status(200).send();
}

module.exports = processTaskChanges;
