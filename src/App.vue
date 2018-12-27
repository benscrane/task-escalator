<template>
  <v-app>
    <NavBar :appTitle="this.appTitle"/>
    <v-content transition="slide-x-transition">
      <router-view></router-view>
    </v-content>
  </v-app>
</template>

<script>
import NavBar from "@/components/NavBar.vue";

export default {
  name: "App",
  components: {
    NavBar: NavBar
  },
  data() {
    return {
      appTitle: "Task Escalator"
    };
  }
};
</script>

<style scoped>
</style>
