import Vue from "vue";
import Router from "vue-router";
import Home from "./views/Home.vue";
import store from "@/store.js";

Vue.use(Router);

const router = new Router({
  mode: "history",
  base: process.env.BASE_URL,
  routes: [
    {
      path: "/",
      name: "home",
      component: Home
    },
    {
      path: "/login",
      name: "login",
      component: () => import("./views/Login.vue")
    },
    {
      path: "/signup",
      name: "signup",
      component: () => import("./views/Signup.vue")
    },
    {
      path: "/profile",
      name: "profile",
      component: () => import("./views/Profile.vue"),
      meta: {
        authRequired: true
      }
    },
    {
      path: "/settings",
      name: "settings",
      component: () => import("./views/Settings.vue"),
      meta: {
        authRequired: true
      }
    },
    {
      path: "/dashboard",
      name: "dashboard",
      component: () => import("./views/Dashboard.vue"),
      meta: {
        authRequired: true
      }
    }
  ]
});

router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.authRequired)) {
    if (!store.state.user) {
      next({
        path: "/login"
      });
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;
