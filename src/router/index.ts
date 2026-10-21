import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { gateRedirect } from '@/utils/account'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/channels/@me' },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guest: true },
    },
    { path: '/forgot-password', name: 'forgot-password', component: () => import('@/views/ForgotPasswordView.vue') },
    { path: '/reset-password', name: 'reset-password', component: () => import('@/views/ResetPasswordView.vue') },
    {
      path: '/oauth/callback',
      name: 'oauth-callback',
      component: () => import('@/views/OAuthCallbackView.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { guest: true },
    },
    // full-screen email gate for accounts without a verified email (legacy / GitHub without email)
    { path: '/verify-email', name: 'email-gate', component: () => import('@/views/EmailGateView.vue') },
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
  if (to.name === 'email-gate' && !auth.isLoggedIn) return '/login'
  if (to.meta.guest && auth.isLoggedIn) return '/channels/@me'
  const gate = gateRedirect(auth.user, { name: to.name, requiresAuth: to.matched.some((r) => r.meta.auth) })
  if (gate && gate !== to.path) return gate
  return true
})

export default router
