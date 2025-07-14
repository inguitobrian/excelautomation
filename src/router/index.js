import { createRouter, createWebHistory } from 'vue-router'
import InputData from '@/views/InputData.vue'
import TransactionView from '@/views/TransactionView.vue'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: InputData,
    },
    {
      path: '/transactions',
      name: 'Transactions',
      component: TransactionView,
    },
  ],
})

export default router
