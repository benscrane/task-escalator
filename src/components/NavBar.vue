<template>
  <v-span>
    <v-navigation-drawer app v-model="drawer" class="blue darken-1" dark disable-resize-watcher>
      <v-list>
        <template v-for="(item, index) in menuItems">
          <v-list-tile :key="index">
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
      <v-toolbar-title>{{appTitle}}</v-toolbar-title>
      <v-spacer class="hidden-sm-and-down"></v-spacer>
      <v-btn flat class="hidden-sm-and-down">Login</v-btn>
      <v-btn color="blue lighten-2" class="hidden-sm-and-down">Sign Up</v-btn>
      <v-btn flat class="hidden-sm-and-down">Logout</v-btn>
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
      menuItems: [{ title: "Login" }, { title: "Sign Up" }, { title: "Logout" }]
    };
  }
};
</script>

<style scoped>
</style>
