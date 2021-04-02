<template>
  <v-app>
    <NavBar />
    <v-main transition="slide-x-transition">
      <router-view></router-view>
    </v-main>
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
