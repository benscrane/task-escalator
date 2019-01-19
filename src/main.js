import "@babel/polyfill";
import Vue from "vue";
import "./plugins/vuetify";
import "./plugins/vue-scrollto";
import App from "./App.vue";
import "@/firebase";
import firebase from "firebase/app";
import "firebase/auth";
import router from "./router";
import store from "./store";
import "./registerServiceWorker";

Vue.config.productionTip = false;
let app;
firebase.auth().onAuthStateChanged(async user => {
  if (!app) {
    if (user) {
      await store.dispatch("authSuccess", {
        user: user
      });
    } else {
      await store.dispatch("userSignOut");
    }
    app = new Vue({
      router,
      store,
      render: h => h(App)
    }).$mount("#app");
  }
});
