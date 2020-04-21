const functions = require('firebase-functions');
const createUserDocument = require("./createUserDocument");
const processTaskChanges = require("./processTaskChanges");
const chronFetchUpdatedTasks = require("./chronFetchUpdatedTasks");
const pubsubSyncUser = require("./pubsubSyncUser");
const pubsubHandleTask = require("./pubsubHandleTask");
const processTodoistOauth = require('./processTodoistOauth');

exports.createUserDocument = functions.auth.user().onCreate(createUserDocument);

exports.processTodoistOauth = functions.https.onRequest(processTodoistOauth);

exports.processTaskChanges = functions.https.onRequest(processTaskChanges);

exports.chronFetchUpdatedTasks = functions.pubsub
  .schedule("*/5 * * * *")
  .onRun(chronFetchUpdatedTasks);

exports.pubsubSyncUser = functions.pubsub.topic("sync-user").onPublish(pubsubSyncUser);

exports.pubsubHandleTask = functions.pubsub.topic("item-updates").onPublish(pubsubHandleTask);
