const { db } = require("./admin.js");

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
  var actionNeeded = loadTask(event_data.event_data.id, user_settings.doc_id)
    .then(taskDocSnapshot => {
      if (!taskDocSnapshot.exists) {
        return "ADD_TASK";
      } else {
        return "FINISH_WRITING";
      }
    })
    .catch(error => {
      console.error(error);
    });
  return actionNeeded;
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
 * @param  {object} event_data  Incoming event data object
 * @param  {object} user_settings User settings object
 */
function addTrackedTask(event_data, user_settings) {
  var documentData = {
    content: event_data.event_data.content,
    current_priority: event_data.event_data.priority,
    current_due_date_utc: event_data.event_data.due_date_utc,
    original_priority: event_data.event_data.priority,
    original_due_date_utc: event_data.event_data.due_date_utc
  };
  return db
    .collection("users")
    .doc(user_settings.doc_id)
    .collection("trackedTasks")
    .doc(String(event_data.event_data.id))
    .set(documentData, { merge: true });
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
            return addTrackedTask(request.body, userSettings);
          case "ESCALATE_TASK":
            return true;
          case "UPDATE_TASK":
            return true;
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
