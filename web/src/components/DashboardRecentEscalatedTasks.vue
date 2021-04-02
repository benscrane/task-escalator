<template>
  <div>
    <v-card>
      <v-toolbar color="accent darken-1" dark>
        <v-toolbar-title>Recently Escalated Tasks</v-toolbar-title>
      </v-toolbar>
      <v-list two-line>
        <v-list-tile
          v-if="recentEscalatedTasks.length === 0">
          <v-list-tile-content>
            <v-list-tile-title>You don't have any escalated tasks yet</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
        <template v-for="(task, index) in recentEscalatedTasks">
          <v-divider
            v-if="index !== 0"
            :inset="true"
            :key="`divider${index}`"></v-divider>
          <v-list-tile
            :key="task.doc_id">
            <v-list-tile-content>
              <v-list-tile-title>{{ task.content }}</v-list-tile-title>
              <v-list-tile-sub-title>
                Escalated from P{{ 5 - task.previous_priority }} to P{{ 4 - task.previous_priority }}
              </v-list-tile-sub-title>
            </v-list-tile-content>
            <v-list-tile-action>
              <v-list-tile-action-text>
                {{ new Date(Number(task.doc_id)).toLocaleDateString("en-US") }}
              </v-list-tile-action-text>
            </v-list-tile-action>
          </v-list-tile>
        </template>
      </v-list>
    </v-card>
  </div>
</template>

<script>
export default {
  name: "DashboardRecentEscalatedTasks",
  props: ["recentEscalatedTasks"]
};
</script>

<style scoped>
</style>
