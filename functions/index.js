const functions = require('firebase-functions');
const createUserDocument = require("./src/createUserDocument");
const processTaskChanges = require("./src/processTaskChanges");
const chronFetchUpdatedTasks = require("./src/chronFetchUpdatedTasks");
const pubsubSyncUser = require("./src/pubsubSyncUser");
const pubsubHandleTask = require("./src/pubsubHandleTask");
const processTodoistOauth = require('./src/processTodoistOauth');

exports.createUserDocument = functions.auth.user().onCreate(createUserDocument);

exports.processTodoistOauth = functions.https.onRequest(processTodoistOauth);

exports.processTaskChanges = functions.https.onRequest(processTaskChanges);

exports.chronFetchUpdatedTasks = functions.pubsub
  .schedule("*/5 * * * *")
  .onRun(chronFetchUpdatedTasks);

exports.pubsubSyncUser = functions.pubsub.topic("sync-user").onPublish(pubsubSyncUser);

exports.pubsubHandleTask = functions.pubsub.topic("item-updates").onPublish(pubsubHandleTask);
