const _ = require("lodash");
const axios = require("axios");
const querystring = require("querystring");
const { db, rollbar } = require("./admin");

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
    return null;
}

module.exports = pubsubSyncUser;