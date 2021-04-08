import { db } from './admin';

// tslint:disable:no-any

export interface TaskalatorUser {
  uid: string;
}

export const createUserDocument = (user: TaskalatorUser): Promise<any> => {
  const docRef = db.collection("users").doc(user.uid);
  const setUser = docRef.set(
    {
      todoistLinked: false
    },
    { merge: true },
  );
  return setUser;
};
