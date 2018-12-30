<template>
  <v-span>
    <v-navigation-drawer app v-model="drawer" class="blue darken-1" dark disable-resize-watcher>
      <v-list>
        <template v-for="(item, index) in menuItems">
          <v-list-tile :key="index" :to="item.path">
            <v-list-tile-content>
              {{item.title}}
            </v-list-tile-content>
          </v-list-tile>
        </template>
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
      <v-btn v-if="isAuthenticated" outline class="hidden-sm-and-down" @click="logout">Logout</v-btn>
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
