import { createRouter, createWebHistory } from 'vue-router'
import InputData from '@/views/InputData.vue'
import TransactionView from '@/views/TransactionView.vue'
import EditRemarks from '@/views/EditRemarks.vue'
import LoginForm from '@/components/auth/LoginForm.vue'

// Authentication helper function
const isAuthenticated = () => {
  return localStorage.getItem('isAuthenticated') === 'true'
}

// Clear authentication data
const clearAuth = () => {
  localStorage.removeItem('isAuthenticated')
  localStorage.removeItem('userRole')
  localStorage.removeItem('username')
  localStorage.removeItem('loginTime')
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/transactions', // 👈 landing page is /transactions
    },
    {
      path: '/transactions',
      name: 'home',
      component: TransactionView,
      meta: { requiresAuth: false }, // 👈 public route
    },
    {
      path: '/inputform',
      name: 'excelform',
      component: InputData,
      meta: { requiresAuth: true }, // 👈 protected
    },
    {
      path: '/editremarks',
      name: 'Editremarks',
      component: EditRemarks,
      meta: { requiresAuth: true }, // 👈 protected
    },
    {
      path: '/login',
      name: 'Loginform',
      component: LoginForm,
      meta: { requiresGuest: true }, // guest only
    },
    {
      path: '/logout',
      name: 'Logout',
      beforeEnter: (to, from, next) => {
        clearAuth()
        next('/login')
      },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/transactions',
    },
  ],
})

// Global navigation guard
router.beforeEach((to, from, next) => {
  const authenticated = isAuthenticated()

  // Protected route
  if (to.meta.requiresAuth && !authenticated) {
    next('/login')
    return
  }

  // Guest-only route
  if (to.meta.requiresGuest && authenticated) {
    next('/inputform')
    return
  }

  next()
})

export default router
