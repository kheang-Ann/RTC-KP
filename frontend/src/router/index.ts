import { createRouter, createWebHistory } from 'vue-router'
import { authService } from '@/services/auth'

// Lazy load views
const NestedLayout = () => import('@/views/layouts/NestedLayout.vue')
const AdminCoursesView = () => import('@/views/admin/CoursesView.vue')
const AdminDashboardView = () => import('@/views/admin/DashboardView.vue')
const AdminDepartmentsView = () => import('@/views/admin/DepartmentsView.vue')
const AdminStudentsView = () => import('@/views/admin/StudentsView.vue')
const AdminTeachersView = () => import('@/views/admin/TeachersView.vue')
const AdminAttendanceView = () => import('@/views/admin/AttendanceView.vue')
const AdminEnrollmentsView = () => import('@/views/admin/EnrollmentsView.vue')
const AdminProgramsView = () => import('@/views/admin/ProgramsView.vue')
const AdminSessionsView = () => import('@/views/admin/SessionsView.vue')
const TeacherDashboardView = () => import('@/views/teacher/DashboardView.vue')
const TeacherAttendanceView = () => import('@/views/teacher/AttendanceView.vue')
const TeacherStudentsView = () => import('@/views/teacher/StudentsView.vue')
const TeacherSessionsView = () => import('@/views/teacher/SessionsView.vue')
const StudentDashboardView = () => import('@/views/student/DashboardView.vue')
const StudentCheckInView = () => import('@/views/student/CheckInView.vue')
const StudentAttendanceView = () => import('@/views/student/AttendanceView.vue')
const StudentCoursesView = () => import('@/views/student/CoursesView.vue')
const StudentLeaveRequestsView = () => import('@/views/student/LeaveRequestsView.vue')
const TeacherLeaveRequestsView = () => import('@/views/teacher/LeaveRequestsView.vue')
const AdminLeaveRequestsView = () => import('@/views/admin/LeaveRequestsView.vue')
const RedirectView = () => import('@/views/RedirectView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guest: true },
    },

    // Admin routes
    {
      path: '/admin',
      component: NestedLayout,
      meta: { requiresAuth: true, roles: ['admin'] },
      children: [
        {
          path: 'dashboard',
          name: 'admin-dashboard',
          component: AdminDashboardView,
        },
        {
          path: 'courses',
          name: 'admin-courses',
          component: AdminCoursesView,
        },
        {
          path: 'departments',
          name: 'admin-departments',
          component: AdminDepartmentsView,
        },
        {
          path: 'programs',
          name: 'admin-programs',
          component: AdminProgramsView,
        },
        {
          path: 'students',
          name: 'admin-students',
          component: AdminStudentsView,
        },
        {
          path: 'teachers',
          name: 'admin-teachers',
          component: AdminTeachersView,
        },
        {
          path: 'attendance',
          name: 'admin-attendance',
          component: AdminAttendanceView,
        },
        {
          path: 'sessions',
          name: 'admin-sessions',
          component: AdminSessionsView,
        },
        {
          path: 'enrollments',
          name: 'admin-enrollments',
          component: AdminEnrollmentsView,
        },
        {
          path: 'leave-requests',
          name: 'admin-leave-requests',
          component: AdminLeaveRequestsView,
        },
      ],
    },

    // Teacher routes
    {
      path: '/teacher',
      component: NestedLayout,
      meta: { requiresAuth: true, roles: ['teacher'] },
      children: [
        {
          path: 'dashboard',
          name: 'teacher-dashboard',
          component: TeacherDashboardView,
        },
        {
          path: 'sessions',
          name: 'teacher-sessions',
          component: TeacherSessionsView,
        },
        {
          path: 'attendance',
          name: 'teacher-attendance',
          component: TeacherAttendanceView,
        },
        {
          path: 'students',
          name: 'teacher-students',
          component: TeacherStudentsView,
        },
        {
          path: 'leave-requests',
          name: 'teacher-leave-requests',
          component: TeacherLeaveRequestsView,
        },
      ],
    },

    // Student routes
    {
      path: '/student',
      component: NestedLayout,
      meta: { requiresAuth: true, roles: ['student'] },
      children: [
        {
          path: 'dashboard',
          name: 'student-dashboard',
          component: StudentDashboardView,
        },
        {
          path: 'check-in',
          name: 'student-checkin',
          component: StudentCheckInView,
        },
        {
          path: 'attendance',
          name: 'student-attendance',
          component: StudentAttendanceView,
        },
        {
          path: 'courses',
          name: 'student-courses',
          component: StudentCoursesView,
        },
        {
          path: 'leave-requests',
          name: 'student-leave-requests',
          component: StudentLeaveRequestsView,
        },
      ],
    },

    // Main app routes with layout
    {
      path: '/',
      component: NestedLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: 'courses',
          name: 'courses',
          component: AdminCoursesView,
          meta: { roles: ['admin'] },
        },
        {
          path: 'departments',
          name: 'departments',
          component: AdminDepartmentsView,
          meta: { roles: ['admin'] },
        },
        {
          path: 'students',
          name: 'students',
          component: TeacherStudentsView,
          meta: { roles: ['teacher', 'admin'] },
        },
        {
          path: 'attendance',
          name: 'attendance',
          component: TeacherAttendanceView,
          meta: { roles: ['teacher', 'admin'] },
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: RedirectView,
          beforeEnter: (_to, _from, next) => {
            if (authService.isAdmin()) {
              next({ name: 'admin-dashboard' })
            } else if (authService.isTeacher()) {
              next({ name: 'teacher-dashboard' })
            } else if (authService.isStudent()) {
              next({ name: 'student-dashboard' })
            } else {
              next({ name: 'login' })
            }
          },
        },
      ],
    },
  ],
})

// Navigation guard for authentication
router.beforeEach((to, _from, next) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const isGuest = to.matched.some((record) => record.meta.guest)
  const requiredRoles = to.meta.roles as string[] | undefined

  if (requiresAuth && !authService.isAuthenticated()) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (isGuest && authService.isAuthenticated()) {
    next({ name: 'dashboard' })
  } else if (requiredRoles && requiredRoles.length > 0) {
    const hasRole = requiredRoles.some((role) => authService.hasRole(role))
    if (!hasRole) {
      next({ name: 'dashboard' })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
