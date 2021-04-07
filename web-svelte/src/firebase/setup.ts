import firebase from 'firebase/app';

const firebaseConfig = {
    apiKey: "AIzaSyAxWJiSO-oWCCEopy1DdMqnEiDm0u1Cz6k",
    authDomain: "taskalator.firebaseapp.com",
    databaseURL: "https://taskalator.firebaseio.com",
    projectId: "taskalator",
    storageBucket: "taskalator.appspot.com",
    messagingSenderId: "359266108969"
};
firebase.initializeApp(firebaseConfig);