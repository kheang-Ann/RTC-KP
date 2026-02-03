<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { usersService, type User, hasRole } from '@/services/users'
import { coursesService, type Course } from '@/services/courses'
import { departmentsService, type Department } from '@/services/departments'
import { authService } from '@/services/auth'

const users = ref<User[]>([])
const courses = ref<Course[]>([])
const departments = ref<Department[]>([])
const loading = ref(false)
const error = ref('')

const user = computed(() => authService.getUser())

const stats = computed(() => {
  const totalUsers = users.value.length
  const totalStudents = users.value.filter((u) => hasRole(u, 'student')).length
  const totalTeachers = users.value.filter((u) => hasRole(u, 'teacher')).length
  const totalAdmins = users.value.filter((u) => hasRole(u, 'admin')).length
  const totalCourses = courses.value.length
  const totalDepartments = departments.value.length

  return {
    totalUsers,
    totalStudents,
    totalTeachers,
    totalAdmins,
    totalCourses,
    totalDepartments,
  }
})

const recentUsers = computed(() => {
  return [...users.value]
    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
    .slice(0, 5)
})

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [usersData, coursesData, departmentsData] = await Promise.all([
      usersService.getAll(),
      coursesService.getAll(),
      departmentsService.getAll(),
    ])
    users.value = usersData
    courses.value = coursesData
    departments.value = departmentsData
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">Welcome, {{ user?.nameLatin || user?.nameKhmer || user?.email }}</h1>
      <p class="page-subtitle">Admin Dashboard</p>
    </div>

    <div v-if="error" class="page-alert page-alert-error">{{ error }}</div>

    <div v-if="loading" class="page-loading">Loading...</div>

    <template v-else>
      <!-- Stats Cards -->
      <div class="page-stats-grid">
        <div class="stat-card border-left-blue">
          <div class="stat-value">{{ stats.totalUsers }}</div>
          <div class="stat-label">Total Users</div>
        </div>
        <div class="stat-card border-left-lightblue">
          <div class="stat-value">{{ stats.totalStudents }}</div>
          <div class="stat-label">Students</div>
        </div>
        <div class="stat-card border-left-green">
          <div class="stat-value">{{ stats.totalTeachers }}</div>
          <div class="stat-label">Teachers</div>
        </div>
        <div class="stat-card border-left-orange">
          <div class="stat-value">{{ stats.totalCourses }}</div>
          <div class="stat-label">Courses</div>
        </div>
        <div class="stat-card border-left-lightred">
          <div class="stat-value">{{ stats.totalDepartments }}</div>
          <div class="stat-label">Departments</div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="page-section">
        <h2 class="section-title">Quick Actions</h2>
        <div class="quick-actions">
          <router-link to="/admin/students" class="action-card card-blue">
            <span class="action-icon">👨‍🎓</span>
            <span class="action-label">Students</span>
            <span class="action-desc">Manage students</span>
          </router-link>
          <router-link to="/admin/teachers" class="action-card card-green">
            <span class="action-icon">👨‍🏫</span>
            <span class="action-label">Teachers</span>
            <span class="action-desc">Manage teachers</span>
          </router-link>
          <router-link to="/admin/departments" class="action-card card-purple">
            <span class="action-icon">🏢</span>
            <span class="action-label">Departments</span>
            <span class="action-desc">Manage departments</span>
          </router-link>
          <router-link to="/admin/programs" class="action-card card-teal">
            <span class="action-icon">🎓</span>
            <span class="action-label">Programs</span>
            <span class="action-desc">Manage programs</span>
          </router-link>
          <router-link to="/admin/courses" class="action-card card-orange">
            <span class="action-icon">📚</span>
            <span class="action-label">Courses</span>
            <span class="action-desc">Manage courses</span>
          </router-link>
          <router-link to="/admin/sessions" class="action-card card-indigo">
            <span class="action-icon">📅</span>
            <span class="action-label">Sessions</span>
            <span class="action-desc">Manage sessions</span>
          </router-link>
          <router-link to="/admin/attendance" class="action-card card-pink">
            <span class="action-icon">✅</span>
            <span class="action-label">Attendance</span>
            <span class="action-desc">View attendance</span>
          </router-link>
          <router-link to="/admin/leave-requests" class="action-card card-red">
            <span class="action-icon">📄</span>
            <span class="action-label">Leave</span>
            <span class="action-desc">Review requests</span>
          </router-link>
          <router-link to="/admin/library" class="action-card card-yellow">
            <span class="action-icon">📖</span>
            <span class="action-label">E-Library</span>
            <span class="action-desc">View library</span>
          </router-link>
        </div>
      </div>

      <!-- Recent Users & Courses -->
      <div class="two-columns">
        <div class="page-section">
          <h2 class="section-title">Recent Users</h2>
          <table v-if="recentUsers.length" class="page-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in recentUsers" :key="u.id">
                <td>{{ u.nameLatin || u.nameKhmer || '-' }}</td>
                <td>{{ u.email }}</td>
                <td>{{ formatDate(u.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else class="page-empty">No users yet.</div>
        </div>

        <div class="page-section">
          <h2 class="section-title">Recent Courses</h2>
          <table v-if="courses.length" class="page-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Credits</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="course in courses.slice(0, 5)" :key="course.id">
                <td>{{ course.code || '-' }}</td>
                <td>{{ course.name }}</td>
                <td>{{ course.credits }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else class="page-empty">No courses yet.</div>
        </div>
      </div>

      <!-- System Overview -->
      <div class="page-section">
        <h2 class="section-title">Courses Overview</h2>
        <div v-if="courses.length" class="page-cards-grid">
          <div v-for="course in courses.slice(0, 6)" :key="course.id" class="course-card">
            <div class="course-code">{{ course.code || course.name }}</div>
            <div class="course-name">{{ course.name }}</div>
            <div class="course-meta">
              <span>{{ course.credits }} credits</span>
              <span v-if="course.teacher">• {{ course.teacher.nameLatin || course.teacher.nameKhmer || '-' }}</span>
            </div>
          </div>
        </div>
        <div v-else class="page-empty">No courses yet.</div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.two-columns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}

.action-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem 1rem;
  text-align: center;
  text-decoration: none;
  color: var(--color-dark-grey);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.action-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--accent-color, #3b82f6), var(--accent-light, #60a5fa));
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.action-card:hover::before {
  transform: scaleX(1);
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  border-color: var(--accent-color, #3b82f6);
}

.action-card.card-blue {
  --accent-color: #3b82f6;
  --accent-light: #60a5fa;
}

.action-card.card-green {
  --accent-color: #10b981;
  --accent-light: #34d399;
}

.action-card.card-purple {
  --accent-color: #8b5cf6;
  --accent-light: #a78bfa;
}

.action-card.card-teal {
  --accent-color: #14b8a6;
  --accent-light: #2dd4bf;
}

.action-card.card-orange {
  --accent-color: #f59e0b;
  --accent-light: #fbbf24;
}

.action-card.card-indigo {
  --accent-color: #6366f1;
  --accent-light: #818cf8;
}

.action-card.card-pink {
  --accent-color: #ec4899;
  --accent-light: #f472b6;
}

.action-card.card-red {
  --accent-color: #ef4444;
  --accent-light: #f87171;
}

.action-icon {
  font-size: 2.25rem;
  display: block;
  margin-bottom: 0.65rem;
  transition: transform 0.3s ease;
}

.action-card:hover .action-icon {
  transform: scale(1.1);
}

.action-label {
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.action-desc {
  font-size: 0.7rem;
  color: var(--color-grey);
}

.course-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.course-code {
  font-size: 1.125rem;
  font-weight: bold;
  color: var(--color-primary);
}

.course-name {
  color: var(--color-dark-grey);
  margin-top: 0.25rem;
}

.course-meta {
  color: #888;
  font-size: 0.75rem;
  margin-top: 0.5rem;
}
</style>
