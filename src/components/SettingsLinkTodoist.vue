<template>
  <div>
    <v-card class="elevation-12">
      <v-toolbar dark color="primary">
        <v-toolbar-title>Link Your Todoist Account</v-toolbar-title>
      </v-toolbar>
      <v-card-text>
        {{appTitle}} needs access to your Todoist account so it can keep track of when tasks are postponed and escalate them appropriately.
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          @click="linkTodoist">Link Todoist</v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script>
export default {
  name: "SettingsLinkTodoist",
  methods: {
    linkTodoist() {
      window.location.assign(
        `https://todoist.com/oauth/authorize?client_id=${
          this.clientId
        }&scope=data:read_write&state=${this.user.uid}`
      );
    }
  },
  computed: {
    appTitle() {
      return this.$store.getters.getAppTitle;
    },
    user() {
      return this.$store.getters.getUser;
    },
    clientId() {
      return this.$store.getters.getTodoistClientId;
    }
  }
};
</script>

<style scoped>
</style>
