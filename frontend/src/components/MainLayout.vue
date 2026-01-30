<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authService } from '@/services/auth'

const route = useRoute()
const router = useRouter()

const user = computed(() => authService.getUser())
const userInitial = computed(() => {
  const u = user.value
  if (u?.nameLatin) return u.nameLatin.charAt(0).toUpperCase()
  if (u?.nameKhmer) return u.nameKhmer.charAt(0).toUpperCase()
  return u?.email?.charAt(0).toUpperCase() || 'U'
})

const userName = computed(() => {
  const u = user.value
  return u?.nameLatin || u?.nameKhmer || u?.email || 'User'
})

const profilePath = computed(() => {
  const roles = user.value?.roles || []
  if (roles.includes('admin')) return '/admin/profile'
  if (roles.includes('teacher')) return '/teacher/profile'
  if (roles.includes('student')) return '/student/profile'
  return '/login'
})

interface MenuItem {
  name: string
  path: string
  icon: string
  roles?: string[]
}

const menuItems: MenuItem[] = [
  // Admin menu items
  { name: 'Dashboard', path: '/admin/dashboard', icon: '🏠', roles: ['admin'] },
  { name: 'Departments', path: '/admin/departments', icon: '🏢', roles: ['admin'] },
  { name: 'Programs', path: '/admin/programs', icon: '📖', roles: ['admin'] },
  { name: 'Courses', path: '/admin/courses', icon: '📚', roles: ['admin'] },
  { name: 'Students', path: '/admin/students', icon: '🎓', roles: ['admin'] },
  { name: 'Teachers', path: '/admin/teachers', icon: '👨‍🏫', roles: ['admin'] },
  { name: 'Enrollments', path: '/admin/enrollments', icon: '📋', roles: ['admin'] },
  { name: 'Leave Requests', path: '/admin/leave-requests', icon: '📝', roles: ['admin'] },
  { name: 'Sessions', path: '/admin/sessions', icon: '📅', roles: ['admin'] },
  { name: 'Attendance', path: '/admin/attendance', icon: '✅', roles: ['admin'] },
  { name: 'Profile', path: '/admin/profile', icon: '👤', roles: ['admin'] },
  // Teacher menu items
  { name: 'Dashboard', path: '/teacher/dashboard', icon: '🏠', roles: ['teacher'] },
  { name: 'Sessions', path: '/teacher/sessions', icon: '📅', roles: ['teacher'] },
  { name: 'Attendance', path: '/teacher/attendance', icon: '✅', roles: ['teacher'] },
  { name: 'Students', path: '/teacher/students', icon: '🎓', roles: ['teacher'] },
  { name: 'Leave Requests', path: '/teacher/leave-requests', icon: '📝', roles: ['teacher'] },
  { name: 'Profile', path: '/teacher/profile', icon: '👤', roles: ['teacher'] },
  // Student menu items
  { name: 'Dashboard', path: '/student/dashboard', icon: '🏠', roles: ['student'] },
  { name: 'Check In', path: '/student/check-in', icon: '✓', roles: ['student'] },
  { name: 'My Attendance', path: '/student/attendance', icon: '📊', roles: ['student'] },
  { name: 'My Courses', path: '/student/courses', icon: '📚', roles: ['student'] },
  { name: 'Leave Requests', path: '/student/leave-requests', icon: '📝', roles: ['student'] },
  { name: 'Profile', path: '/student/profile', icon: '👤', roles: ['student'] },
]

const visibleMenuItems = computed(() => {
  const userRoles = user.value?.roles || []
  return menuItems.filter((item) => {
    if (!item.roles) return true
    return item.roles.some((role) => userRoles.includes(role))
  })
})

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/')
}

function logout() {
  authService.logout()
  router.push('/login')
}
</script>

<template>
  <div class="layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <span class="menu-label">Menu</span>
      </div>
      <nav class="sidebar-nav">
        <router-link
          v-for="item in visibleMenuItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-text">{{ item.name }}</span>
        </router-link>
      </nav>
    </aside>

    <!-- Main Content -->
    <div class="main-wrapper">
      <!-- Top Navbar -->
      <header class="navbar">
        <h1 class="navbar-title">Student Management System</h1>
        <div class="navbar-user">
          <router-link :to="profilePath" class="user-profile-link">
            <div class="user-avatar">{{ userInitial }}</div>
            <span class="user-name">{{ userName }}</span>
          </router-link>
          <button class="logout-btn" @click="logout">Logout</button>
        </div>
      </header>

      <!-- Page Content -->
      <main class="content">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
  background: #f5f7fa;
}

/* Sidebar */
.sidebar {
  width: 220px;
  background: #fff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.menu-label {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.sidebar-nav {
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  text-decoration: none;
  color: #4b5563;
  font-weight: 500;
  transition: all 0.2s;
}

.nav-item:hover {
  background: #f3f4f6;
}

.nav-item.active {
  background: #6366f1;
  color: white;
}

.nav-icon {
  font-size: 18px;
}

.nav-text {
  font-size: 15px;
}

/* Navbar */
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.navbar {
  height: 64px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.navbar-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.navbar-user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-profile-link {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.2s;
}

.user-profile-link:hover {
  background: #f3f4f6;
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: #6366f1;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.user-name {
  font-weight: 500;
  color: #374151;
}

.logout-btn {
  padding: 8px 16px;
  background: #fef3c7;
  color: #92400e;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.logout-btn:hover {
  background: #fde68a;
}

/* Content */
.content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}
</style>
