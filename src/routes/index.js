import Vue from 'vue';
import VueRouter from 'vue-router';
import store from "../store/index";

Vue.use(VueRouter);

const router = new VueRouter({
  mode: 'history',
  routes: [
    {
      path: '/',
      redirect: '/signin',
    },
    {
      path: '/signin',
      component: () => import('../views/SigninPage.vue'),
      beforeEnter: (to, from, next) => {
        if(store.getters.isLogin) {
          next('/main');
        } else {
          next();
        }
      }
    },
    {
      path: '/signup',
      component: () => import('../views/SignupPage.vue'),
    },
    {
      path: '/main',
      component: () => import('../views/MainPage.vue'),
      meta: { authRequired: true }
    },
    {
      path: '*',
      component: () => import('../views/NotFoundPage.vue'),
    },
  ],
});

router.beforeEach(function (to, from, next) {
  if(to.meta.authRequired && !store.getters.isLogin) {
    next('/signin');
  } else {
    next();
  }
});

export default router;
