<template>
  <v-container fill-height>
    <v-layout align-center justify-center>
      <v-flex xs12 sm8 lg4>
        <v-card class="elevation-12">
          <v-toolbar dark color="primary">
            <v-toolbar-title>Login</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-form 
              ref="form" 
              v-model="valid" 
              lazy-validation
              id="loginForm"
              @submit.prevent="submitLogin">
              <v-text-field 
                prepend-icon="mdi-account"
                name="email"
                label="Email"
                type="email"
                v-model="email"
                :rules="emailRules"
                required>
              </v-text-field>
              <v-text-field
                prepend-icon="mdi-lock"
                name="password"
                label="Password"
                id="password"
                type="password"
                v-model="password"
                :rules="passwordRules"
                required>
              </v-text-field>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <div @click="showModal" id="resetPasswordLink">
              Forgot your password?
            </div>
            <v-spacer></v-spacer>
            <v-btn 
              color="primary" 
              :disabled="!valid" 
              type="submit"
              form="loginForm">Login</v-btn>
          </v-card-actions>
        </v-card>
      </v-flex>
    </v-layout>
    <reset-password-modal
      v-show="isModalVisible"
      @close="closeModal" />
  </v-container>
</template>

<script>
import ResetPasswordModal from "@/components/ResetPasswordModal.vue";

export default {
  name: "Login",
  components: {
    ResetPasswordModal: ResetPasswordModal
  },
  data() {
    return {
      valid: false,
      isModalVisible: false,
      isResetNotificationVisible: false,
      email: "",
      password: "",
      emailRules: [
        v => !!v || "E-mail is required",
        v => /.+@.+/.test(v) || "E-mail must be valid"
      ],
      passwordRules: [
        v => !!v || "Password is required",
        v => v.length >= 6 || "Password must be greater than 6 characters"
      ]
    };
  },
  methods: {
    submitLogin() {
      // implement method
      if (this.$refs.form.validate()) {
        this.$store.dispatch("userLogin", {
          email: this.email,
          password: this.password
        });
      }
    },
    showModal() {
      this.isModalVisible = true;
    },
    closeModal() {
      this.isModalVisible = false;
    }
  }
};
</script>

<style scoped>
#resetPasswordLink {
  cursor: pointer;
}
</style>
