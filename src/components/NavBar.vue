<template>
  <v-span>
    <v-navigation-drawer app v-model="drawer" class="blue darken-1" dark disable-resize-watcher>
      <v-list>
        <div v-if="!isAuthenticated">
          <v-list-tile to="/login">
            <v-list-tile-content>
              Login
            </v-list-tile-content>
          </v-list-tile>
          <v-list-tile to="signup">
            <v-list-tile-content>
              Sign Up
            </v-list-tile-content>
          </v-list-tile>
        </div>
        <div v-if="isAuthenticated">
          <v-list-tile to="/profile">
            <v-list-tile-content>
              Profile
            </v-list-tile-content>
          </v-list-tile>
          <v-list-tile @click="logout">
            <v-list-tile-content>
              Logout
            </v-list-tile-content>
          </v-list-tile>
        </div>
      </v-list>
    </v-navigation-drawer>
    <v-toolbar app color="blue lighten-1" dark>
      <v-toolbar-side-icon class="hidden-md-and-up" @click="drawer = !drawer"></v-toolbar-side-icon>
      <v-spacer class="hidden-md-and-up"></v-spacer>
      <router-link to="/">
        <v-toolbar-title>{{appTitle}}</v-toolbar-title>
      </router-link>
      <v-spacer class="hidden-sm-and-down"></v-spacer>
      <div v-if="!isAuthenticated" class="hidden-sm-and-down">
        <v-btn flat to="/login">Login</v-btn>
        <v-btn color="blue lighten-2" to="/signup">Sign Up</v-btn>
      </div>
      <div v-if="isAuthenticated" class="hidden-sm-and-down">
        <v-btn flat to="/profile">Profile</v-btn>
        <v-btn outline @click="logout">Logout</v-btn>
      </div>
    </v-toolbar>
  </v-span>
</template>

<script>
export default {
  name: "NavBar",
  props: ["appTitle"],
  data() {
    return {
      drawer: false,
      menuItems: [
        {
          title: "Login",
          path: "/login"
        },
        {
          title: "Sign Up",
          path: "/signup"
        },
        {
          title: "Logout"
        }
      ]
    };
  },
  computed: {
    isAuthenticated() {
      return this.$store.getters.isAuthenticated;
    }
  },
  methods: {
    logout() {
      this.$store.dispatch("userSignOut");
    }
  }
};
</script>

<style scoped>
a {
  text-decoration: none;
  color: white;
}
</style>
