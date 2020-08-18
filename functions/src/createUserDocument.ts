import { db } from './admin';

interface TaskalatorUser {
  uid: string;
}

// should return a promise since this as an async function
export const createUserDocument = (user: TaskalatorUser) => {
  const docRef = db.collection("users").doc(user.uid);
  const setUser = docRef.set(
    {
      todoistLinked: false
    },
    { merge: true }
  );
  return setUser;
};
