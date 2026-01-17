import { createRouter, createWebHistory } from 'vue-router'
import InputData from '@/views/InputData.vue'
import TransactionView from '@/views/TransactionView.vue'
import EditRemarks from '@/views/EditRemarks.vue'
import LoginForm from '@/components/auth/LoginForm.vue'
import CalendarSchedule from '@/views/CalendarSchedule.vue'

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
      redirect: '/transactions',
    },
    {
      path: '/transactions',
      name: 'home',
      component: TransactionView,
      meta: { requiresAuth: true }, // 👈 now protected
    },
    {
      path: '/inputform',
      name: 'excelform',
      component: InputData,
      meta: { requiresAuth: true },
    },
    {
      path: '/editremarks',
      name: 'Editremarks',
      component: EditRemarks,
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'Loginform',
      component: LoginForm,
      meta: { requiresGuest: true }, // guest only
    },
    {
      path: '/calendar',
      name: 'CalendarSchedule',
      component: CalendarSchedule,
      meta: { requiresAuth: true },
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
      redirect: '/login', // 👈 redirect unknown routes to login
    },
  ],
})

// Global navigation guard
router.beforeEach((to, from, next) => {
  const authenticated = isAuthenticated()

  // If going to login page and already authenticated, redirect to transactions
  if (to.meta.requiresGuest && authenticated) {
    next('/transactions')
    return
  }

  // If route requires auth and not authenticated, redirect to login
  if (to.meta.requiresAuth && !authenticated) {
    next('/login')
    return
  }

  next()
})

export default router
