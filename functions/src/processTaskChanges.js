const { db } = require("./admin.js");
const request = require("request");
const uuidv4 = require("uuid/v4");

/**
 * Summary. Filters incoming event data from todoist webhooks
 * Description. Filters out events that are not item:added or item:updated
 * @param  {object} eventData  Object containing the incoming event data to evaluate
 * @returns {boolean} True if the task should be filtered out, false if the task should be evaluated further
 */
function filterTask(eventData) {
  // check event type, filter anything that's not added or updated
  if (
    !(
      eventData.event_name === "item:updated" ||
      eventData.event_name === "item:added"
    )
  ) {
    console.log("filter task match");
    return true;
  }
  // filter out tasks with no due date
  if (eventData.event_data.due_date_utc === null) {
    return true;
  }
  // filter out recurring tasks, for now just look for "every" in the date string
  if (eventData.event_data.date_string.indexOf("every") !== -1) {
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
  //TODO write function
  var userQuery = db
    .collection("users")
    .where("todoistUserId", "==", todoistUserId)
    .get();
  var userSettings = userQuery
    .then(querySnapshot => {
      var settingsObj = querySnapshot.docs[0].data();
      settingsObj.doc_id = querySnapshot.docs[0].id;
      console.log(settingsObj);
      return settingsObj;
    })
    .catch(error => {
      console.error(error);
    });
  return userSettings;
}

/**
 * Summary. Returns the necessary action based on user settings and incoming task data
 * @param  {object} event_data
 * @param  {object} user_settings
 * @returns {string}  "ADD_TASK", "UPDATE_TASK", or "ESCALATE_TASK"
 */
function determineActionNeeded(event_data, user_settings) {
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
      console.error(error);
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
      console.error(error);
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
      console.error(error);
    });
  return shouldTaskUpdatePromise;
}

/**
 * Summary. Determines if a task should be updated in the tracked tasks database
 * @param  {object} event_data
 * @param  {documentSnapshot} taskDocSnapshot
 * @returns {string} UPDATE_TASK if the task should be updated, NO_ACTION if not
 */
function shouldTaskUpdate(event_data, taskDocSnapshot) {
  var taskDocData = taskDocSnapshot.data();
  if (event_data.event_data.priority !== taskDocData.current_priority) {
    return "UPDATE_TASK";
  }
  if (event_data.event_data.content !== taskDocData.content) {
    return "UPDATE_TASK";
  }
  if (event_data.event_data.due_date_utc !== taskDocData.current_due_date_utc) {
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
function shouldTaskEscalate(event_data, user_settings, taskDocSnapshot) {
  // can't escalate if it's already top priority
  if (event_data.event_data.priority === 4) {
    return "CONTINUE_EVALUATION";
  }
  // check if priority is unchanged
  var taskDocData = taskDocSnapshot.data();
  if (taskDocData.current_priority === event_data.event_data.priority) {
    // priorities match
    var incomingDueDate = new Date(event_data.event_data.due_date_utc);
    var currentDueDate = new Date(taskDocData.current_due_date_utc);
    var daysBeforeEscalation =
      user_settings[`p${5 - event_data.event_data.priority}Days`];
    var dueDateDifference =
      incomingDueDate.getTime() - currentDueDate.getTime();
    var msBeforeEscalation = daysBeforeEscalation * 24 * 60 * 60 * 1000;
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
function addTrackedTask(event_data, user_settings, action) {
  var documentData = {
    content: event_data.event_data.content,
    current_priority: event_data.event_data.priority,
    current_due_date_utc: event_data.event_data.due_date_utc
  };
  if (action === "ADD_NEW") {
    documentData.original_priority = event_data.event_data.priority;
    documentData.original_due_date_utc = event_data.event_data.due_date_utc;
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
function addEscalatedTask(event_data, user_settings) {
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
      return addTrackedTask(event_data, user_settings, "UPDATE_EXISTING");
    })
    .catch(error => {
      console.log(error);
    });
  //TODO: increment the distributed counter here
  return updateEscalatedTaskPromise;
}

/**
 * @param  {object} event_data
 * @param  {object} user_settings
 */
function escalateTrackedTask(event_data, user_settings) {
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
    console.log(response);
    console.log(body);
    if (!error && response.statusCode === 200) {
      var syncBody = JSON.parse(body);
      if (syncBody.sync_status[uuid] === "ok") {
        // successful update
        return addEscalatedTask(event_data, user_settings);
      }
      return false;
    } else {
      console.log(error);
      return false;
    }
  });
}

function processTaskChanges(request, response) {
  // filter out tasks
  if (filterTask(request.body)) {
    // task is filtered out
    response.status(200).send();
  } else {
    console.log(request.body);
    var userSettings = {};
    //Get the user document from the todoist ID (request.body.user_id)
    var loadDataPromise = loadUserData(request.body.user_id);
    var actionNeededPromise = loadDataPromise
      .then(settingsObject => {
        userSettings = settingsObject;
        // determine the required action based on incoming task info and user settings
        return determineActionNeeded(request.body, settingsObject);
      })
      .catch(error => {
        console.error(error);
      });
    // when we have the action needed, execute it
    actionNeededPromise
      .then(actionNeeded => {
        switch (actionNeeded) {
          case "ADD_TASK":
            console.log("Add task");
            return addTrackedTask(request.body, userSettings, "ADD_NEW");
          case "ESCALATE_TASK":
            console.log("Escalate task");
            return escalateTrackedTask(request.body, userSettings);
          case "UPDATE_TASK":
            console.log("Update task");
            return addTrackedTask(
              request.body,
              userSettings,
              "UPDATE_EXISTING"
            );
          default:
            console.log("Hit default case");
            return true;
        }
      })
      .catch(error => {
        console.error(error);
      });
    response.status(200).send();
  }
}

module.exports = processTaskChanges;