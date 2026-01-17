import { createRouter, createWebHistory } from 'vue-router'
import leaveRoutes from './leave.routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [...leaveRoutes],
})

export default router
