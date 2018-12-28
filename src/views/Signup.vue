<template>
  <v-container fill-height>
    <v-layout align-center justify-center>
      <v-flex xs12 sm8 lg4>
        <v-card class="elevation-12">
          <v-toolbar dark color="primary">
            <v-toolbar-title>Sign Up</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-form ref="form" v-model="valid" lazy-validation>
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
            <v-spacer></v-spacer>
            <v-btn color="primary" :disabled="!valid" @click="submitLogin">Sign Up</v-btn>
          </v-card-actions>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
export default {
  name: "Signup",
  data() {
    return {
      valid: false,
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
    submitSignup() {
      // implement method
    }
  }
};
</script>

<style scoped>
</style>
