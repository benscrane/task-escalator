const _ = require("lodash");
const axios = require("axios");
const querystring = require("querystring");
const { db, rollbar } = require("./admin");
const { PubSub } = require("@google-cloud/pubsub");

const pubsub = new PubSub();
const pushTopic = "item-updates";

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

// filter no due date and recurring tasks
// should we filter out completed tasks we don't need to store all that
async function filterTasks(items) {
    return items.filter(item => {
        if (!_.get(item, "due")) return false;
        if (_.get(item, "due.is_recurring")) return false;
        if (_.get(item, "checked")) return false;
        return true;
    })
}

async function processTaskUpdates(todoistData, userData) {
    const items = _.get(todoistData, "items") || [];
    const filteredItems = filterTasks(items);
    if (_.isEmpty(filteredItems)) {
        return;
    }
    // submit all messages to pubsub
    // this will be thousands when users sign up
    // filtering will help here
    for (const item of filteredItems) {
        const data = {
            ...item,
            user: userData
        };
        const dataBuffer = Buffer.from(JSON.stringify(data));
        pubsub.topic(pushTopic).publish(dataBuffer);
    }
    return;
}

async function pubsubSyncUser(message) {
    // get todoist id
    const data = JSON.parse(Buffer.from(message.data, "base64").toString("utf-8")) || {};
    const todoistUid = _.get(data, "todoistId");
    if (!todoistUid) return null;
    // find and load user data from db
    const userData = await loadUserData(todoistUid);
    console.log(userData);
    // get changes from todoist
    const todoistData = await getTodoistSync(userData);
    console.log(todoistData);
    // process todoist changes
    // should this be in one or 
    await processTaskUpdates(todoistData, userData);
    return null;
}

module.exports = pubsubSyncUser;