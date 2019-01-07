<template>
  <v-container fill-height>
    <v-layout align-center justify-center column>
      <v-flex v-if="!userSettings.todoistLinked" xs12 sm8 lg4>
        <SettingsLinkTodoist />
      </v-flex>
      <v-flex v-if="userSettings.todoistLinked" xs12 sm8 lg4>
        <SettingsTaskalator />
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import SettingsLinkTodoist from "@/components/SettingsLinkTodoist.vue";
import SettingsTaskalator from "@/components/SettingsTaskalator.vue";

export default {
  name: "Settings",
  components: {
    SettingsLinkTodoist: SettingsLinkTodoist,
    SettingsTaskalator: SettingsTaskalator
  },
  computed: {
    user() {
      return this.$store.getters.getUser;
    },
    userSettings() {
      return this.$store.getters.getUserSettings;
    }
  }
};
</script>

<style scoped>
</style>
