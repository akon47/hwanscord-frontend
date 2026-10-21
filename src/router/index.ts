import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/channels/@me' },
    { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { guest: true } },
    { path: '/register', name: 'register', component: () => import('@/views/RegisterView.vue'), meta: { guest: true } },
    // legacy v1 paths
    { path: '/signin', redirect: '/login' },
    { path: '/signup', redirect: '/register' },
    { path: '/main/:rest(.*)*', redirect: '/channels/@me' },
    {
      path: '/channels',
      component: () => import('@/views/WorkspaceView.vue'),
      meta: { auth: true },
      children: [
        { path: '', redirect: '/channels/@me' },
        { path: '@me', name: 'home', component: { render: () => null } },
        { path: '@me/:channelId', name: 'dm', component: { render: () => null } },
        { path: ':channelId', name: 'channel', component: { render: () => null } },
      ],
    },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue') },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.ready) await auth.bootstrap()
  if (to.matched.some((r) => r.meta.auth) && !auth.isLoggedIn) {
    return { name: 'login', query: to.fullPath !== '/channels/@me' ? { redirect: to.fullPath } : undefined }
  }
  if (to.meta.guest && auth.isLoggedIn) return '/channels/@me'
  return true
})

export default router
