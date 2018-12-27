<template>
  <v-container fluid fill-height class="home-hero">
    <v-layout justify-center align-center column pa-5>
      <div class="display-4 font-weight-black blue--text text--lighten-1 text-xs-center">
        Task Escalator
      </div>
      <div class="display-1 font-weight-bold blue--text text--darken-3 text-xs-center">
        An extension for Todoist
      </div>
      <v-btn fab class="mt-5 blue darken-1">
        <v-icon large color="white">mdi-chevron-down</v-icon>
      </v-btn>
    </v-layout>
  </v-container>
</template>

<script>
export default {
  name: "HomeHero"
};
</script>

<style scoped>
.home-hero {
  background: url("https://source.unsplash.com/rznBKkZiIEk") center;
  background-size: cover;
  width: 100%;
  height: 100%;
}
</style>
