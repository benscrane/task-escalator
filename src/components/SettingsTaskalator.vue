<template>
  <div>
    <v-card class="elevation-12">
      <v-toolbar dark color="primary">
        <v-toolbar-title>Taskalator Settings</v-toolbar-title>
      </v-toolbar>
      <TaskalatorSettingsView
        v-if="!editing"
        v-bind:userSettings="userSettings" />
      <TaskalatorSettingsEdit 
        v-if="editing"
        ref="TaskalatorSettingsEdit"
        v-bind:userSettings="userSettings"/>
      <v-card-actions>
        <v-btn
          color="accent"
          @click="editing = !editing"
          v-if="!editing">Edit</v-btn>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          v-if="editing"
          @click="saveSettings">Save</v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script>
import TaskalatorSettingsView from "@/components/TaskalatorSettingsView.vue";
import TaskalatorSettingsEdit from "@/components/TaskalatorSettingsEdit.vue";

export default {
  name: "SettingsTaskalator",
  components: {
    TaskalatorSettingsView: TaskalatorSettingsView,
    TaskalatorSettingsEdit: TaskalatorSettingsEdit
  },
  props: ["userSettings"],
  data() {
    return {
      editing: false
    };
  },
  methods: {
    saveSettings() {
      this.editing = false;
      this.$refs.TaskalatorSettingsEdit.saveSettings();
    }
  }
};
</script>

<style scoped>
</style>
