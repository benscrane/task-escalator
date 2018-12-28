<template>
  <span>
    <HomeHero />
    <HomeDetails />
  </span>
</template>

<script>
import HomeHero from "@/components/HomeHero.vue";
import HomeDetails from "@/components/HomeDetails.vue";

export default {
  name: "home",
  components: {
    HomeHero: HomeHero,
    HomeDetails: HomeDetails
  }
};
</script>

<style scoped>
</style>
