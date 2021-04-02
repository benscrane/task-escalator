<template>
  <v-card-text>
        <v-form>
          <v-text-field
            name="p2Days"
            label="P2 days"
            :disabled=true
            v-model="userSettings.p2Days">
          </v-text-field>
          <v-text-field
            name="p3Days"
            label="P3 days"
            :disabled=true
            v-model="userSettings.p3Days">
          </v-text-field> 
          <v-text-field
            name="p4Days"
            label="P4 days"
            :disabled=true
            v-model="userSettings.p4Days">
          </v-text-field>   
        </v-form>
      </v-card-text>
</template>

<script>
export default {
  name: "TaskalatorSettingsView",
  props: ["userSettings"]
};
</script>

<style scoped>
</style>
