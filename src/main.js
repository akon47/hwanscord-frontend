import Vue from "vue";
import App from "./App.vue";
import router from "./routes/index";
import store from "./store/index";
import VueSocketIOExt from "vue-socket.io-extended";
import socket from "./socket/index";
import VueMobileDetection from "vue-mobile-detection";
import "./fontAwesomeIcon.js";
import VTooltip from 'v-tooltip'

Vue.config.productionTip = false;

Vue.use(VueMobileDetection);
Vue.use(VTooltip)
Vue.use(VueSocketIOExt, socket);

new Vue({
  sockets:{
    connect() {
      console.log("socket connected");
    },
    disconnect() {
      console.log("socket closed");
    },
    connect_error() {
      console.log("connect_error");
    },
    unauthorized() {
      console.log("unauthorized");
      this.$socket.client.disconnect();
    }
  },
  render: h => h(App),
  router,
  store
}).$mount("#app");
