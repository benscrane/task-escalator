const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Rollbar = require("rollbar");

admin.initializeApp(functions.config().firebase);

var db = admin.firestore();

const rollbar = new Rollbar({
    accessToken: functions.config().rollbar.access_token,
    captureUncaught: true,
    captureUnhandledRejections: true,
  });

module.exports = { db, rollbar };
