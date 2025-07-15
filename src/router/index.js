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
      redirect: '/login', // Redirect root to login
    },
    {
      path: '/transactions',
      name: 'home',
      component: TransactionView,
      meta: { requiresAuth: true }, // Protected route
    },
    {
      path: '/inputform',
      name: 'excelform',
      component: InputData,
      meta: { requiresAuth: true }, // Protected route
    },
    {
      path: '/editremarks',
      name: 'Editremarks',
      component: EditRemarks,
      meta: { requiresAuth: true }, // Protected route
    },
    {
      path: '/login',
      name: 'Loginform',
      component: LoginForm,
      meta: { requiresGuest: true }, // Only accessible when not authenticated
    },
    {
      path: '/logout',
      name: 'Logout',
      beforeEnter: (to, from, next) => {
        // Clear authentication and redirect to login
        clearAuth()
        next('/login')
      },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/login', // Catch-all route redirects to login
    },
  ],
})

// Global navigation guard
router.beforeEach((to, from, next) => {
  const authenticated = isAuthenticated()

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authenticated) {
    // User is not authenticated, redirect to login
    next('/login')
    return
  }

  // Check if route requires guest (not authenticated)
  if (to.meta.requiresGuest && authenticated) {
    // User is already authenticated, redirect to main page
    next('/inputform')
    return
  }

  // Continue with navigation
  next()
})

export default router
