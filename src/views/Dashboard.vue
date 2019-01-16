<template>
  <v-container>
    <v-layout justify-center align-center>
      <v-flex xs12 sm10 lg8>
        <v-layout column>
          <v-flex d-flex text-xs-center>
            <p class="headline">
              {{ userTotalEscalatedPhrase  }}
            </p>
          </v-flex>
          <v-flex class="mt-2">
            <DashboardRecentEscalatedTasks 
              v-bind:recentEscalatedTasks="recentEscalatedTasks"/>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import DashboardRecentEscalatedTasks from "@/components/DashboardRecentEscalatedTasks.vue";

export default {
  name: "Dashboard",
  components: {
    DashboardRecentEscalatedTasks: DashboardRecentEscalatedTasks
  },
  computed: {
    recentEscalatedTasks() {
      var tempTaskArr = this.$store.getters.getRecentEscalatedTasks;
      return tempTaskArr.sort((a, b) => {
        return b.doc_id - a.doc_id;
      });
    },
    userTotalEscalatedPhrase() {
      var numEscalated = Number(this.$store.getters.getUserTotalEscalated);
      if (numEscalated === 0) {
        return `0 tasks have been escalated for you`;
      } else if (numEscalated === 1) {
        return `1 task has been escalated for you`;
      } else {
        return `${numEscalated} tasks have been escalated for you`;
      }
    }
  }
};
</script>

<style scoped>
</style>
