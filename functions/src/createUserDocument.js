const { db, rollbar } = require("./admin.js");

function createUserDocument(user) {
  var docRef = db.collection("users").doc(user.uid);
  var setUser = docRef.set(
    {
      todoistLinked: false
    },
    { merge: true }
  );
  return setUser;
}

module.exports = createUserDocument;
