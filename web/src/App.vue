<template>
  <v-app>
    <NavBar />
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
  }
};
</script>

<style scoped>
</style>
