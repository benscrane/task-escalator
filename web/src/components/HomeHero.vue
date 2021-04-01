<template>
  <v-container fluid fill-height class="home-hero">
    <v-layout justify-center align-center column pa-5>
      <div
        class="display-4 font-weight-black primary--text text--lighten-2 text-xs-center appTitle">
        <img src="@/assets/logo.png" class="main-logo" />
      </div>
      <div class="display-1 font-weight-bold accent--text text-xs-center">
        An extension for Todoist
      </div>
      <v-btn fab class="mt-5 accent darken-1" v-scroll-to="'#homeDetails'">
        <v-icon large color="white">mdi-chevron-down</v-icon>
      </v-btn>
    </v-layout>
  </v-container>
</template>

<script>
export default {
  name: "HomeHero",
  computed: {
    appTitle() {
      return this.$store.getters.getAppTitle;
    }
  }
};
</script>

<style scoped>
.home-hero {
  /*background: url("https://source.unsplash.com/rznBKkZiIEk") center;*/
  background: url("https://source.unsplash.com/3ym6i13Y9LU") center;
  background-size: cover;
  width: 100%;
  height: 100%;
  max-height: 100vh;
}
.main-logo {
  max-height: 30vh;
  max-width: 100%;
}
</style>
