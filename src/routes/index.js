import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

export default new VueRouter({
  routes: [
    {
      path: '/',
      redirect: '/signin',
    },
    {
      path: '/signin',
      component: () => import('../views/SigninPage.vue'),
    },
    {
      path: '/signup',
      component: () => import('../views/SignupPage.vue'),
    },
    {
      path: '/chat',
      component: () => import('../views/ChatPage.vue'),
    },
    {
      path: '*',
      component: () => import('../views/NotFoundPage.vue'),
    },
  ],
});
