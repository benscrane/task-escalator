import Vue from "vue";
import Vuetify from "vuetify";
import "vuetify/dist/vuetify.min.css";

Vue.use(Vuetify);

export default new Vuetify({
  iconfont: "mdi",
  theme: {
    primary: "#00334b",
    secondary: "#808285",
    accent: "#93332a"
  }
});
