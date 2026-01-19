import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/attendance-scan'
    },
    {
      path: '/attendance-scan',
      name: 'AttendanceScan',
      component: () => import('@/views/AttendanceScan.vue')
    }
  ],
})

export default router
