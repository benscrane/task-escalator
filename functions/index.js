const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp(functions.config().firebase);

var db = admin.firestore();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

exports.createUserDocument = functions.auth.user().onCreate(user => {
  var docRef = db.collection("users").doc(user.uid);
  var setUser = docRef.set({
    todoistLinked: false
  });
  return setUser;
});
