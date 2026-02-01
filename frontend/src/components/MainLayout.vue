<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authService } from '@/services/auth'

const route = useRoute()
const router = useRouter()

// Mobile menu state
const isMobileMenuOpen = ref(false)

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
  { name: 'Groups', path: '/admin/groups', icon: '👥', roles: ['admin'] },
  { name: 'Schedule', path: '/admin/schedule', icon: '📆', roles: ['admin'] },
  { name: 'Students', path: '/admin/students', icon: '🎓', roles: ['admin'] },
  { name: 'Teachers', path: '/admin/teachers', icon: '👨‍🏫', roles: ['admin'] },
  { name: 'Leave Requests', path: '/admin/leave-requests', icon: '📝', roles: ['admin'] },
  { name: 'Sessions', path: '/admin/sessions', icon: '📅', roles: ['admin'] },
  { name: 'Attendance', path: '/admin/attendance', icon: '✅', roles: ['admin'] },
  { name: 'Profile', path: '/admin/profile', icon: '👤', roles: ['admin'] },
  // Teacher menu items
  { name: 'Dashboard', path: '/teacher/dashboard', icon: '🏠', roles: ['teacher'] },
  { name: 'My Schedule', path: '/teacher/schedule', icon: '📆', roles: ['teacher'] },
  { name: 'Sessions', path: '/teacher/sessions', icon: '📅', roles: ['teacher'] },
  { name: 'Attendance', path: '/teacher/attendance', icon: '✅', roles: ['teacher'] },
  { name: 'Students', path: '/teacher/students', icon: '🎓', roles: ['teacher'] },
  { name: 'Leave Requests', path: '/teacher/leave-requests', icon: '📝', roles: ['teacher'] },
  { name: 'Profile', path: '/teacher/profile', icon: '👤', roles: ['teacher'] },
  // Student menu items
  { name: 'Dashboard', path: '/student/dashboard', icon: '🏠', roles: ['student'] },
  { name: 'Check In', path: '/student/check-in', icon: '✓', roles: ['student'] },
  { name: 'My Schedule', path: '/student/schedule', icon: '📆', roles: ['student'] },
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

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false
}
</script>

<template>
  <div class="layout">
    <!-- Mobile Menu Toggle -->
    <button class="mobile-menu-toggle" @click="toggleMobileMenu">
      <span class="hamburger" :class="{ open: isMobileMenuOpen }"></span>
    </button>

    <!-- Mobile Overlay -->
    <div 
      v-if="isMobileMenuOpen" 
      class="mobile-overlay" 
      @click="closeMobileMenu"
    ></div>

    <!-- Sidebar -->
    <aside class="sidebar" :class="{ open: isMobileMenuOpen }">
      <div class="sidebar-header">
        <span class="menu-label">Menu</span>
        <button class="close-menu" @click="closeMobileMenu">✕</button>
      </div>
      <nav class="sidebar-nav">
        <router-link
          v-for="item in visibleMenuItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
          @click="closeMobileMenu"
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
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 220px;
  background: #fff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  z-index: 100;
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
  background: var(--color-primary);
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
  margin-left: 220px;
}

.navbar {
  position: fixed;
  top: 0;
  right: 0;
  left: 220px;
  height: 64px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 90;
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
  background: var(--color-primary);
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
  margin-top: 64px;
  padding: 24px;
  overflow-y: auto;
}

/* Mobile Menu Toggle */
.mobile-menu-toggle {
  display: none;
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 200;
  width: 40px;
  height: 40px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  align-items: center;
  justify-content: center;
}

.hamburger {
  display: block;
  width: 20px;
  height: 2px;
  background: #374151;
  position: relative;
  transition: all 0.3s;
}

.hamburger::before,
.hamburger::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 2px;
  background: #374151;
  left: 0;
  transition: all 0.3s;
}

.hamburger::before {
  top: -6px;
}

.hamburger::after {
  top: 6px;
}

.hamburger.open {
  background: transparent;
}

.hamburger.open::before {
  transform: rotate(45deg);
  top: 0;
}

.hamburger.open::after {
  transform: rotate(-45deg);
  top: 0;
}

.mobile-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 90;
}

.close-menu {
  display: none;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
}

/* Responsive styles */
@media (max-width: 768px) {
  .mobile-menu-toggle {
    display: flex;
  }

  .mobile-overlay {
    display: block;
  }

  .close-menu {
    display: block;
  }

  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .main-wrapper {
    margin-left: 0;
  }

  .navbar {
    left: 0;
    padding: 0 16px 0 60px;
  }

  .navbar-title {
    font-size: 16px;
  }

  .user-name {
    display: none;
  }

  .content {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .navbar-title {
    font-size: 14px;
  }

  .logout-btn {
    padding: 6px 10px;
    font-size: 12px;
  }

  .user-avatar {
    width: 32px;
    height: 32px;
    font-size: 12px;
  }

  .content {
    padding: 12px;
  }
}
</style>
