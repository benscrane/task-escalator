import { db } from './admin';

function createUserDocument(user: any) {
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
