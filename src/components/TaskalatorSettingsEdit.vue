<template>
  <v-card-text>
        <v-form
          ref="form"
          lazy-validation
          id="settingsForm"
          @submit.prevent="saveSettings">
          <v-text-field
            name="p2Days"
            label="P2 days"
            type="number"
            v-model.number="p2Days">
          </v-text-field>
          <v-text-field
            name="p3Days"
            label="P3 days"
            type="number"
            v-model.number="p3Days">
          </v-text-field> 
          <v-text-field
            name="p4Days"
            label="P4 days"
            type="number"
            v-model.number="p4Days">
          </v-text-field>   
        </v-form>
      </v-card-text>
</template>

<script>
export default {
  name: "TaskalatorSettingsEdit",
  props: ["userSettings"],
  computed: {
    user() {
      return this.$store.getters.getUser;
    }
  },
  data() {
    return {
      p2Days: null,
      p3Days: null,
      p4Days: null
    };
  },
  created() {
    this.p2Days = Number(this.userSettings.p2Days);
    this.p3Days =
      this.userSettings.p3Days > 0 ? Number(this.userSettings.p3Days) : null;
    this.p4Days =
      this.userSettings.p4Days > 0 ? Number(this.userSettings.p4Days) : null;
  },
  methods: {
    saveSettings() {
      this.$store.dispatch("saveUserSettings", {
        p2Days: this.p2Days,
        p3Days: this.p3Days,
        p4Days: this.p4Days
      });
    }
  }
};
</script>

<style scoped>
</style>
