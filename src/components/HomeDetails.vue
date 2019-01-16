<template>
  <v-container>
    <v-layout column>
      <v-flex class="display-2 text-xs-center my-5">
        Task Escalator Keeps You On Track
      </v-flex>
      <v-flex>
        <p class="subheading mt-3 mx-5">
          It's easy for the lowest priority tasks to be the ones that get pushed to tomorrow when we don't have time to get everything done.  
          Getting pushed back a few days is usually fine but what happens when these low priority tasks keep getting pushed back until they're
          weeks from their original due date?  Do they become more important then?  Task Escalator thinks so.  
        </p>
        <p class="subheading mt-3 mx-5">
          Based on thresholds that you control, Task Escalator will raise the priority of your tasks if they've been pushed back too far from 
          their original due date.
        </p>
        <div class="headline mt-3 text-xs-center">
          An extension for Todoist
        </div>
        <p class="subheading mt-3 mx-5">
          After you link your Todoist account to your Task Escalator account, we'll receive updates from Todoist and check to see if the task 
          was pushed back and if it should be escalated.
        </p>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
export default {
  name: "HomeDetails"
};
</script>

<style scoped>
</style>
