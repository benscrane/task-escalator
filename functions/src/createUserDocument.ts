import { db } from './admin';

interface TaskalatorUser {
  uid: string;
}

// tslint:disable:no-any

export const createUserDocument = (user: TaskalatorUser): Promise<any> => {
  const docRef = db.collection("users").doc(user.uid);
  const setUser = docRef.set(
    {
      todoistLinked: false
    },
    { merge: true }
  );
  return setUser;
};
