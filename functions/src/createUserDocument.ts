import { db } from './admin';

export const createUserDocument = (user: any) => {
  const docRef = db.collection("users").doc(user.uid);
  const setUser = docRef.set(
    {
      todoistLinked: false
    },
    { merge: true }
  );
  return setUser;
};
