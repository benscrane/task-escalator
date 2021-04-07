import firebase from 'firebase/app';
import 'firebase/auth';
import { readable } from 'svelte/store';

const userMapper = claims => ({
    id: claims.user_id,
    email: claims.email,
});

const auth = firebase.auth();

export const loginWithEmailPassword = (email, password) =>
        auth.signInWithEmailAndPassword(email, password);

export const logout = () => auth.signOut();

export const user = readable(null, set => {
    const unsub = auth.onAuthStateChanged(async fireUser => {
        if (fireUser) {
            const token = await fireUser.getIdTokenResult();
            const user = userMapper(token.claims);
            set(user);
        } else {
            set(null);
        }
    });

    return unsub;
});

// export const initAuth = (useRedirect = false) => {
//     const auth = firebase.auth();

//     const loginWithEmailPassword = (email, password) =>
//         auth.signInWithEmailAndPassword(email, password);

//     const logout = () => auth.signOut();

//     const user = readable(null, set => {
//         const unsub = auth.onAuthStateChanged(async fireUser => {
//             if (fireUser) {
//                 const token = await fireUser.getIdTokenResult();
//                 const user = userMapper(token.claims);
//                 set(user);
//             } else {
//                 set(null);
//             }
//         });

//         return unsub;
//     });

//     return {
//         user,
//         loginWithEmailPassword,
//         logout,
//     };
// }