import type { RouteRecordRaw } from 'vue-router'

const leaveRoutes: RouteRecordRaw[] = [
  {
    path: '/leave',
    name: 'LeaveManagement',
    component: () => import('@/components/Leave/LeaveManagement.vue'),
    meta: { requiresAuth: true },
  },
]

export default leaveRoutes
