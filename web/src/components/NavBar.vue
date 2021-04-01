<template>
  <span>
    <v-navigation-drawer
      app
      v-model="drawer"
      class="primary darken-1"
      dark
      disable-resize-watcher>
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
          <v-list-tile to="/dashboard">
            <v-list-tile-content>
              Dashboard
            </v-list-tile-content>
          </v-list-tile>
          <v-list-tile to="/settings">
            Settings
          </v-list-tile>
          <v-list-tile @click="logout">
            <v-list-tile-content>
              Logout
            </v-list-tile-content>
          </v-list-tile>
        </div>
      </v-list>
    </v-navigation-drawer>
    <v-toolbar app color="primary lighten-1" dark>
      <v-toolbar-side-icon class="hidden-md-and-up" @click="drawer = !drawer">
      </v-toolbar-side-icon>
      <v-spacer class="hidden-md-and-up"></v-spacer>
      <router-link to="/">
        <v-toolbar-title>
          <img src="@/assets/icon_logo.png" class="image-icon" />
        </v-toolbar-title>
      </router-link>
      <v-spacer class="hidden-sm-and-down"></v-spacer>
      <div v-if="!isAuthenticated" class="hidden-sm-and-down">
        <v-btn flat to="/login">Login</v-btn>
        <v-btn color="primary lighten-2" to="/signup">Sign Up</v-btn>
      </div>
      <div v-if="isAuthenticated" class="hidden-sm-and-down">
        <v-btn flat to="/dashboard">Dashboard</v-btn>
        <v-btn flat to="/settings">Settings</v-btn>
        <v-btn outline @click="logout">Logout</v-btn>
      </div>
    </v-toolbar>
  </span>
</template>

<script>
export default {
  name: "NavBar",
  data() {
    return {
      drawer: false
    };
  },
  computed: {
    isAuthenticated() {
      return this.$store.getters.isAuthenticated;
    },
    appTitle() {
      return this.$store.getters.getAppTitle;
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
.image-icon {
  max-height: 40px;
}
</style>
