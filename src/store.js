import Vue from "vue";
import Vuex from "vuex";
import firebase from "firebase";
import router from "@/router";

Vue.use(Vuex);
var db = firebase.firestore();
db.settings({
  timestampsInSnapshots: true
});

export default new Vuex.Store({
  state: {
    user: null,
    isAuthenticated: false,
    userSettings: null
  },
  getters: {
    isAuthenticated(state) {
      return state.user !== null && state.user !== undefined;
    },
    getUser(state) {
      return state.user;
    },
    getUserSettings(state) {
      return state.userSettings;
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
    }
  },
  actions: {
    userJoin({ commit }, { email, password }) {
      firebase
        .auth()
        .createUserWithEmailAndPassword(email, password)
        .then(user => {
          commit("setUser", user);
          commit("setIsAuthenticated", true);
          db.collection("users")
            .doc(user.uid)
            .onSnapshot(function(doc) {
              commit("setUserSettings", doc.data());
            });
          router.push("/dashboard");
        })
        .catch(() => {
          commit("setUser", null);
          commit("setIsAuthenticated", false);
          router.push("/");
        });
    },
    userLogin({ commit }, { email, password }) {
      firebase
        .auth()
        .signInWithEmailAndPassword(email, password)
        .then(user => {
          console.log(user);
          commit("setUser", user);
          commit("setIsAuthenticated", true);
          db.collection("users")
            .doc(user.uid)
            .onSnapshot(function(doc) {
              commit("setUserSettings", doc.data());
            });
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
    }
  }
});
