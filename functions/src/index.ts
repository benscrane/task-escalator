import * as functions from 'firebase-functions';
import createUserDocument from './createUserDocument';
import processTaskChanges from './processTaskChanges';
import chronFetchUpdatedTasks from './chronFetchUpdatedTasks';
import { pubsubSyncUser}  from './pubsubSyncUser';
import pubsubHandleTask from './pubsubHandleTask';
import processTodoistOauth from './processTodoistOauth';

exports.createUserDocument = functions.auth.user().onCreate(createUserDocument);

exports.processTodoistOauth = functions.https.onRequest(processTodoistOauth);

exports.processTaskChanges = functions.https.onRequest(processTaskChanges);

exports.chronFetchUpdatedTasks = functions.pubsub
  .schedule("*/5 * * * *")
  .onRun(chronFetchUpdatedTasks);

exports.pubsubSyncUser = functions.pubsub.topic("sync-user").onPublish(pubsubSyncUser);

exports.pubsubHandleTask = functions.pubsub.topic("item-updates").onPublish(pubsubHandleTask);
