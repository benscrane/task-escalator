<template>
  <transition name="modal-fade">
    <div class="modal-backdrop">
      <v-layout align-center justify-center>
        <v-flex xs12 sm8 lg4>
          <v-card class="elevation-12">
            <v-toolbar dark color="primary">
              <v-toolbar-title>Reset Password</v-toolbar-title>
            </v-toolbar>
            <v-card-text>
              <v-form
                ref="resetForm"
                v-model="valid"
                lazy-validation
                id="resetForm"
                @submit.prevent="resetPassword">
                <v-text-field
                  prepend-icon="mdi-account"
                  name="email"
                  label="Email"
                  type="email"
                  v-model="email"
                  :rules="emailRules"
                  required>
                </v-text-field>
              </v-form>
            </v-card-text>
            <v-card-actions>
              <v-btn
                color="accent"
                @click="closeModal">Cancel</v-btn>
              <v-spacer></v-spacer>
              <v-btn
                color="primary"
                :disabled="!valid"
                type="submit"
                form="resetForm">Reset</v-btn>
            </v-card-actions>
          </v-card>
        </v-flex>
      </v-layout>
    </div>
  </transition>
</template>

<script>
import firebase from "firebase";

export default {
  name: "ResetPasswordModal",
  data() {
    return {
      valid: false,
      email: "",
      emailRules: [
        v => !!v || "E-mail is required",
        v => /.+@.+/.test(v) || "E-mail must be valid"
      ]
    };
  },
  methods: {
    closeModal() {
      this.$emit("close");
    },
    resetPassword() {
      if (this.$refs.resetForm.validate()) {
        firebase
          .auth()
          .sendPasswordResetEmail(this.email)
          .then(() => {
            // TODO: display notification
            this.$emit("close");
          })
          .catch(error => {
            console.log(error);
          });
      }
    }
  }
};
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
