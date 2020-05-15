import { db } from './admin';

function createUserDocument(user: any) {
  const docRef = db.collection("users").doc(user.uid);
  const setUser = docRef.set(
    {
      todoistLinked: false
    },
    { merge: true }
  );
  return setUser;
}

module.exports = createUserDocument;
