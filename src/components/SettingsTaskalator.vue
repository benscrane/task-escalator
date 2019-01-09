<template>
  <div>
    <v-card class="elevation-12">
      <v-toolbar dark color="primary">
        <v-toolbar-title>Taskalator Settings</v-toolbar-title>
      </v-toolbar>
      <v-card-text>
        <v-form
          ref="form"
          v-model="valid"
          lazy-validation
          id="settingsForm"
          @submit.prevent="saveSettings">
          <v-text-field
            name="p2Days"
            label="P2 days"
            type="number"
            :disabled="!editing"
            v-model.number="p2days">
          </v-text-field>
          <v-text-field
            name="p3Days"
            label="P3 days"
            type="number"
            :disabled="!editing"
            v-model.number="p3Days">
          </v-text-field> 
          <v-text-field
            name="p4Days"
            label="P4 days"
            type="number"
            :disabled="!editing"
            v-model.number="p4Days">
          </v-text-field>   
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-btn
          color="accent"
          @click="editing = !editing"
          v-if="!editing">Edit</v-btn>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          :disabled="!valid"
          v-if="editing"
          type="submit"
          form="settingsForm">Save</v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script>
export default {
  name: "SettingsTaskalator",
  props: ["userSettings"],
  data() {
    return {
      valid: false,
      p2Days: "",
      p3Days: "3",
      p4Days: "",
      editing: false
    };
  },
  methods: {
    saveSettings() {
      console.log("Save settings");
    }
  },
  created() {
    this.p2Days = this.userSettings.p2Days;
    this.p3Days = this.userSettings.p3Days;
    this.p4Days = this.userSettings.p4Days;
  }
};
</script>

<style scoped>
</style>
