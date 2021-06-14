import Vue from "vue";
import App from "./App.vue";
import router from "./routes/index";
import store from "./store/index";
import VueSocketIOExt from "vue-socket.io-extended";
import socket from "./socket/index";
import { formatDate } from './utils/filters';

Vue.filter('formatDate', formatDate);
Vue.config.productionTip = false;

Vue.use(VueSocketIOExt, socket);

new Vue({
  render: h => h(App),
  router,
  store
}).$mount("#app");
