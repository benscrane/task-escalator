import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import Rollbar from 'rollbar';

admin.initializeApp(functions.config().firebase);

const db = admin.firestore();

const rollbar = new Rollbar({
    accessToken: functions.config().rollbar.access_token,
    captureUncaught: true,
    captureUnhandledRejections: true,
  });

export {
  db,
  rollbar
};
