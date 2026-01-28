<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { usersService, type User, hasRole } from '@/services/users'
import { coursesService, type Course } from '@/services/courses'
import { departmentsService, type Department } from '@/services/departments'
import { enrollmentsService, type Enrollment } from '@/services/enrollments'
import { authService } from '@/services/auth'

const users = ref<User[]>([])
const courses = ref<Course[]>([])
const departments = ref<Department[]>([])
const enrollments = ref<Enrollment[]>([])
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
  const totalEnrollments = enrollments.value.length

  return {
    totalUsers,
    totalStudents,
    totalTeachers,
    totalAdmins,
    totalCourses,
    totalDepartments,
    totalEnrollments,
  }
})

const recentUsers = computed(() => {
  return [...users.value]
    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
    .slice(0, 5)
})

const recentEnrollments = computed(() => {
  return [...enrollments.value]
    .sort((a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime())
    .slice(0, 5)
})

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [usersData, coursesData, departmentsData, enrollmentsData] = await Promise.all([
      usersService.getAll(),
      coursesService.getAll(),
      departmentsService.getAll(),
      enrollmentsService.getAll(),
    ])
    users.value = usersData
    courses.value = coursesData
    departments.value = departmentsData
    enrollments.value = enrollmentsData
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
  <div class="admin-dashboard">
    <h1>Welcome, {{ user?.firstName }} {{ user?.lastName }}</h1>
    <p class="subtitle">Admin Dashboard</p>

    <div v-if="error" class="alert alert-error">{{ error }}</div>

    <div v-if="loading" class="loading">Loading...</div>

    <template v-else>
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card stat-primary">
          <div class="stat-value">{{ stats.totalUsers }}</div>
          <div class="stat-label">Total Users</div>
        </div>
        <div class="stat-card stat-info">
          <div class="stat-value">{{ stats.totalStudents }}</div>
          <div class="stat-label">Students</div>
        </div>
        <div class="stat-card stat-success">
          <div class="stat-value">{{ stats.totalTeachers }}</div>
          <div class="stat-label">Teachers</div>
        </div>
        <div class="stat-card stat-warning">
          <div class="stat-value">{{ stats.totalCourses }}</div>
          <div class="stat-label">Courses</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalDepartments }}</div>
          <div class="stat-label">Departments</div>
        </div>
        <div class="stat-card stat-purple">
          <div class="stat-value">{{ stats.totalEnrollments }}</div>
          <div class="stat-label">Enrollments</div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="section">
        <h2>Quick Actions</h2>
        <div class="quick-actions">
          <router-link to="/admin/users" class="action-card">
            <span class="action-icon">👤</span>
            <span class="action-label">Manage Users</span>
          </router-link>
          <router-link to="/admin/courses" class="action-card">
            <span class="action-icon">📚</span>
            <span class="action-label">Manage Courses</span>
          </router-link>
          <router-link to="/admin/departments" class="action-card">
            <span class="action-icon">🏢</span>
            <span class="action-label">Manage Departments</span>
          </router-link>
          <router-link to="/admin/enrollments" class="action-card">
            <span class="action-icon">📋</span>
            <span class="action-label">Manage Enrollments</span>
          </router-link>
          <router-link to="/teacher/sessions" class="action-card">
            <span class="action-icon">📅</span>
            <span class="action-label">View Sessions</span>
          </router-link>
          <router-link to="/teacher/attendance" class="action-card">
            <span class="action-icon">✅</span>
            <span class="action-label">View Attendance</span>
          </router-link>
        </div>
      </div>

      <!-- Recent Users & Enrollments -->
      <div class="two-columns">
        <div class="section">
          <h2>Recent Users</h2>
          <table v-if="recentUsers.length" class="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in recentUsers" :key="u.id">
                <td>{{ u.firstName }} {{ u.lastName }}</td>
                <td>{{ u.email }}</td>
                <td>{{ formatDate(u.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty">No users yet.</div>
        </div>

        <div class="section">
          <h2>Recent Enrollments</h2>
          <table v-if="recentEnrollments.length" class="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="enrollment in recentEnrollments" :key="enrollment.id">
                <td>{{ enrollment.student?.firstName }} {{ enrollment.student?.lastName }}</td>
                <td>{{ enrollment.course?.code || enrollment.course?.name }}</td>
                <td>{{ formatDate(enrollment.enrolledAt) }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty">No enrollments yet.</div>
        </div>
      </div>

      <!-- System Overview -->
      <div class="section">
        <h2>Courses Overview</h2>
        <div v-if="courses.length" class="courses-grid">
          <div v-for="course in courses.slice(0, 6)" :key="course.id" class="course-card">
            <div class="course-code">{{ course.code || course.name }}</div>
            <div class="course-name">{{ course.name }}</div>
            <div class="course-meta">
              <span>{{ course.credits }} credits</span>
              <span v-if="course.teacher">• {{ course.teacher.firstName }} {{ course.teacher.lastName }}</span>
            </div>
          </div>
        </div>
        <div v-else class="empty">No courses yet.</div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.admin-dashboard {
  padding: 1rem;
}

h1 {
  margin-bottom: 0.25rem;
}

.subtitle {
  color: #666;
  margin-bottom: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 1.25rem;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #333;
}

.stat-label {
  color: #666;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.stat-primary {
  border-left: 4px solid #4f46e5;
}

.stat-success {
  border-left: 4px solid #22c55e;
}

.stat-warning {
  border-left: 4px solid #f59e0b;
}

.stat-info {
  border-left: 4px solid #3b82f6;
}

.stat-purple {
  border-left: 4px solid #8b5cf6;
}

.section {
  margin-bottom: 2rem;
}

.section h2 {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: #333;
}

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
  color: #333;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.course-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.course-code {
  font-size: 1.125rem;
  font-weight: bold;
  color: #4f46e5;
}

.course-name {
  color: #333;
  margin-top: 0.25rem;
}

.course-meta {
  color: #888;
  font-size: 0.75rem;
  margin-top: 0.5rem;
}

.table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.table th,
.table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.table th {
  background: #f5f5f5;
  font-weight: 600;
  font-size: 0.875rem;
}

.table td {
  font-size: 0.875rem;
}

.alert {
  padding: 0.75rem 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.alert-error {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ffcdd2;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.empty {
  text-align: center;
  padding: 2rem;
  color: #888;
  background: #f9f9f9;
  border-radius: 8px;
}
</style>
