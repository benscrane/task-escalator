import * as functions from 'firebase-functions';
import chronFetchUpdatedTasks from './chronFetchUpdatedTasks';
import { createUserDocument } from './createUserDocument';
import { processTaskChanges } from './processTaskChanges';
import processTodoistOauth from './processTodoistOauth';
import { pubsubSyncUser}  from './pubsubSyncUser';

exports.createUserDocument = functions.auth.user().onCreate(createUserDocument);

exports.processTodoistOauth = functions.https.onRequest(processTodoistOauth);

exports.processTaskChanges = functions.https.onRequest(processTaskChanges);

exports.chronFetchUpdatedTasks = functions.pubsub
  .schedule('*/5 * * * *')
  .onRun(chronFetchUpdatedTasks);

exports.pubsubSyncUser = functions.pubsub.topic('sync-user').onPublish(pubsubSyncUser);
