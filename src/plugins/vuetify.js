import Vue from "vue";
import Vuetify from "vuetify";
import "vuetify/dist/vuetify.min.css";
import colors from "vuetify/es5/util/colors";

Vue.use(Vuetify, {
  iconfont: "mdi",
  theme: {
    primary: colors.blue.darken2,
    secondary: colors.blue.lighten1,
    accent: colors.orange.accent4
  }
});
