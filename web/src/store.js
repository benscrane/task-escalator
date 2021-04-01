import Vue from "vue";
import Vuex from "vuex";
import firebase from "firebase/app";
import "firebase/firestore";
import router from "@/router";

Vue.use(Vuex);

var db = firebase.firestore();

export default new Vuex.Store({
  state: {
    appTitle: "Task Escalator",
    todoistClientId: "c6f183f8c7124cabb5a15ec8fcfbba60",
    db: db,
    user: null,
    isAuthenticated: false,
    userSettings: null,
    recentEscalatedTasks: [],
    userTotalEscalated: null
  },
  getters: {
    getAppTitle(state) {
      return state.appTitle;
    },
    getTodoistClientId(state) {
      return state.todoistClientId;
    },
    isAuthenticated(state) {
      return state.user !== null && state.user !== undefined;
    },
    getUser(state) {
      return state.user;
    },
    getUserSettings(state) {
      return state.userSettings;
    },
    getRecentEscalatedTasks(state) {
      return state.recentEscalatedTasks;
    },
    getUserTotalEscalated(state) {
      return state.userTotalEscalated;
    }
  },
  mutations: {
    setUser(state, payload) {
      state.user = payload;
    },
    setIsAuthenticated(state, payload) {
      state.isAuthenticated = payload;
    },
    setUserSettings(state, payload) {
      state.userSettings = payload;
    },
    setRecentEscalatedTasks(state, payload) {
      // array of recently updated tasks
      state.recentEscalatedTasks = payload;
    },
    setUserTotalEscalated(state, payload) {
      state.userTotalEscalated = payload;
    }
  },
  actions: {
    userJoin({ commit, dispatch }, { email, password }) {
      firebase
        .auth()
        .createUserWithEmailAndPassword(email, password)
        .then(user => {
          commit("setUser", user.user);
          commit("setIsAuthenticated", true);
          dispatch("loadUserData");
          router.push("/dashboard");
        })
        .catch(() => {
          commit("setUser", null);
          commit("setIsAuthenticated", false);
          router.push("/");
        });
    },
    userLogin({ commit, dispatch }, { email, password }) {
      firebase
        .auth()
        .signInWithEmailAndPassword(email, password)
        .then(user => {
          commit("setUser", user.user);
          commit("setIsAuthenticated", true);
          dispatch("loadUserData");
          router.push("/dashboard");
        })
        .catch(() => {
          commit("setUser", null);
          commit("setIsAuthenticated", false);
          router.push("/");
        });
    },
    userSignOut({ commit }) {
      firebase
        .auth()
        .signOut()
        .then(() => {
          commit("setUser", null);
          commit("setIsAuthenticated", false);
          router.push("/");
        })
        .catch(() => {
          commit("setUser", null);
          commit("setIsAuthenticated", false);
          router.push("/");
        });
    },
    authSuccess({ commit, dispatch }, { user }) {
      commit("setUser", user);
      commit("setIsAuthenticated", true);
      dispatch("loadUserData");
    },
    saveUserSettings({ state }, { p2Days, p3Days, p4Days }) {
      state.db
        .collection("users")
        .doc(state.user.uid)
        .set(
          {
            p2Days: p2Days,
            p3Days: p3Days,
            p4Days: p4Days
          },
          { merge: true }
        )
        .then(() => {
          console.log("Settings saved successfully");
        })
        .catch(error => {
          console.error("Error saving settings: ", error);
        });
    },
    async loadUserData({ commit, state, dispatch }) {
      state.db
        .collection("users")
        .doc(state.user.uid)
        .onSnapshot(doc => {
          commit("setUserSettings", doc.data());
        });
      dispatch("loadRecentEscalatedTasks");
      dispatch("loadUserTotalEscalatedTasks");
    },
    async loadRecentEscalatedTasks({ commit, state }) {
      var escalatedTasksRef = state.db
        .collection("users")
        .doc(state.user.uid)
        .collection("escalatedTasks");
      // TODO: add a limit back and add order by after timestamps are implemented
      escalatedTasksRef.onSnapshot(querySnapshot => {
        if (!querySnapshot.empty) {
          // we have results, commit them
          var docDataArr = [];
          querySnapshot.docs.forEach(documentSnapshot => {
            var tempDocData = documentSnapshot.data();
            tempDocData.doc_id = documentSnapshot.id;
            docDataArr.push(tempDocData);
          });
          commit("setRecentEscalatedTasks", docDataArr);
        } else {
          commit("setRecentEscalatedTasks", []);
        }
      });
    },
    async loadUserTotalEscalatedTasks({ commit, state }) {
      var escalatedTasksRef = state.db
        .collection("users")
        .doc(state.user.uid)
        .collection("escalatedTasks");
      escalatedTasksRef.onSnapshot(querySnapshot => {
        commit("setUserTotalEscalated", querySnapshot.size);
      });
    }
  }
});
