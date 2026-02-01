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
          <router-link to="/admin/students" class="action-card">
            <span class="action-icon">👨‍🎓</span>
            <span class="action-label">Manage Students</span>
          </router-link>
          <router-link to="/admin/teachers" class="action-card">
            <span class="action-icon">👨‍🏫</span>
            <span class="action-label">Manage Teachers</span>
          </router-link>
          <router-link to="/admin/departments" class="action-card">
            <span class="action-icon">🏢</span>
            <span class="action-label">Manage Departments</span>
          </router-link>
          <router-link to="/admin/programs" class="action-card">
            <span class="action-icon">🎓</span>
            <span class="action-label">Manage Programs</span>
          </router-link>
          <router-link to="/admin/courses" class="action-card">
            <span class="action-icon">📚</span>
            <span class="action-label">Manage Courses</span>
          </router-link>
          <router-link to="/admin/sessions" class="action-card">
            <span class="action-icon">📅</span>
            <span class="action-label">Manage Sessions</span>
          </router-link>
          <router-link to="/admin/attendance" class="action-card">
            <span class="action-icon">✅</span>
            <span class="action-label">Manage Attendance</span>
          </router-link>
          <router-link to="/admin/leave-requests" class="action-card">
            <span class="action-icon">📄</span>
            <span class="action-label">Leave Requests</span>
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
  border-radius: 8px;
  padding: 1.25rem;
  text-align: center;
  text-decoration: none;
  color: var(--color-dark-grey);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.action-icon {
  font-size: 1.75rem;
  display: block;
  margin-bottom: 0.5rem;
}

.action-label {
  font-weight: 500;
  font-size: 0.875rem;
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
  color: var(--color-purple);
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
