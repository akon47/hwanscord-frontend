import Vue from 'vue'
import App from './App.vue'
import router from './routes/index'
import store from './store/index'
import vueSocketIO from './socket/index'

Vue.config.productionTip = false

Vue.use(vueSocketIO);

new Vue({
  render: h => h(App),
  router,
  store,
}).$mount('#app')
