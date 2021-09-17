<template>
  <v-container fill-height>
    <v-layout align-center justify-center>
      <v-flex xs12 sm8 lg4>
        <div class="text-xs-center">
          <v-progress-circular
            :size="80"
            color="primary"
            indeterminate
          ></v-progress-circular>
        </div>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import axios from "axios";

export default {
  name: "TodoistOauth",
  data() {
    return {
      state: null,
      code: null,
      success: false,
    };
  },
  computed: {
    user() {
      return this.$store.getters.getUser;
    },
    clientId() {
      return this.$store.getters.getTodoistClientId;
    },
  },
  mounted() {
    if (this.$route.query.state === this.user.uid) {
      const code = this.$route.query.code;
      axios
        .get(
          `https://us-central1-taskalator.cloudfunctions.net/processTodoistOauth?code=${code}&uid=${this.user.uid}`
        )
        .then(() => {
          setTimeout(() => {
            this.$router.replace("/settings");
          }, 2000);
        })
        .catch((error) => {
          // eslint:disable-next-line:no-console
          console.error(error);
          this.$router.replace("/settings");
        });
    }
  },
};
</script>

<style scoped></style>
