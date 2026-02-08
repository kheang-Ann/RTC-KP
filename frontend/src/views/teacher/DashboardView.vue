<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { coursesService, type Course } from '@/services/courses'
import { sessionsService, type Session } from '@/services/sessions'
import { authService } from '@/services/auth'

const courses = ref<Course[]>([])
const sessions = ref<Session[]>([])
const loading = ref(false)
const error = ref('')

const user = computed(() => authService.getUser())

const stats = computed(() => {
  const totalCourses = courses.value.length
  const totalSessions = sessions.value.length
  const activeSessions = sessions.value.filter((s) => s.status === 'active').length
  const scheduledSessions = sessions.value.filter((s) => s.status === 'scheduled').length
  const completedSessions = sessions.value.filter((s) => s.status === 'completed').length

  return { totalCourses, totalSessions, activeSessions, scheduledSessions, completedSessions }
})

const recentSessions = computed(() => {
  return [...sessions.value]
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 5)
})

const todaySessions = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return sessions.value.filter((s) => {
    const sessionDate = new Date(s.startTime)
    return sessionDate >= today && sessionDate < tomorrow
  })
})

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [coursesData, sessionsData] = await Promise.all([
      coursesService.getMyCourses(),
      sessionsService.getAll(),
    ])
    courses.value = coursesData
    sessions.value = sessionsData
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function getStatusClass(status: string) {
  const classes: Record<string, string> = {
    scheduled: 'status-scheduled',
    active: 'status-active',
    completed: 'status-completed',
    cancelled: 'status-cancelled',
  }
  return classes[status] || ''
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="page-container">
    <h1 class="page-title">Welcome, {{ user?.nameLatin || user?.nameKhmer || user?.email }}</h1>
    <p class="page-subtitle">Teacher Dashboard</p>

    <div v-if="error" class="page-alert page-alert-error">{{ error }}</div>

    <div v-if="loading" class="page-loading">Loading...</div>

    <template v-else>
      <!-- Stats Cards -->
      <div class="page-stats-grid">
        <div class="stat-card border-left-blue">
          <div class="stat-value">{{ stats.totalCourses }}</div>
          <div class="stat-label">My Courses</div>
        </div>
        <div class="stat-card border-left-lightblue">
          <div class="stat-value ">{{ stats.totalSessions }}</div>
          <div class="stat-label">Total Sessions</div>
        </div>
        <div class="stat-card border-left-green">
          <div class="stat-value">{{ stats.activeSessions }}</div>
          <div class="stat-label">Active Now</div>
        </div>
        <div class="stat-card border-left-orange">
          <div class="stat-value">{{ stats.scheduledSessions }}</div>
          <div class="stat-label">Scheduled</div>
        </div>
        <div class="stat-card border-left-lightpurple">
          <div class="stat-value">{{ stats.completedSessions }}</div>
          <div class="stat-label">Completed</div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="page-section">
        <h2 class="section-title">Quick Actions</h2>
        <div class="quick-actions">
          <router-link to="/teacher/sessions" class="action-card card-blue">
            <span class="action-icon">📅</span>
            <span class="action-label">Sessions</span>
            <span class="action-desc">Manage sessions</span>
          </router-link>
          <router-link to="/teacher/attendance" class="action-card card-green">
            <span class="action-icon">✅</span>
            <span class="action-label">Attendance</span>
            <span class="action-desc">Mark attendance</span>
          </router-link>
          <router-link to="/teacher/students" class="action-card card-purple">
            <span class="action-icon">👥</span>
            <span class="action-label">Students</span>
            <span class="action-desc">View students</span>
          </router-link>
          <router-link to="/teacher/leave-requests" class="action-card card-orange">
            <span class="action-icon">📝</span>
            <span class="action-label">Leave</span>
            <span class="action-desc">Review requests</span>
          </router-link>
          <router-link to="/teacher/library" class="action-card card-teal">
            <span class="action-icon">📖</span>
            <span class="action-label">E-Library</span>
            <span class="action-desc">Browse resources</span>
          </router-link>
        </div>
      </div>

      <!-- Today's Sessions -->
      <div class="page-section">
        <h2 class="section-title">Today's Sessions</h2>
        <div v-if="todaySessions.length" class="sessions-list">
          <div v-for="session in todaySessions" :key="session.id" class="session-card">
            <div class="session-info">
              <div class="session-title">{{ session.title }}</div>
              <div class="session-course">{{ session.course?.code || session.course?.name }}</div>
              <div class="session-time">{{ formatDateTime(session.startTime) }}</div>
            </div>
            <div class="session-status">
              <span class="status-badge" :class="getStatusClass(session.status)">
                {{ session.status }}
              </span>
              <span v-if="session.status === 'active'" class="attendance-code">
                Code: {{ session.attendanceCode }}
              </span>
            </div>
          </div>
        </div>
        <div v-else class="page-empty">No sessions scheduled for today.</div>
      </div>

      <!-- My Courses -->
      <div class="page-section">
        <h2 class="section-title">My Courses</h2>
        <div v-if="courses.length" class="courses-grid">
          <div v-for="course in courses" :key="course.id" class="course-card">
            <div class="course-code">{{ course.code || course.name }}</div>
            <div class="course-name">{{ course.name }}</div>
            <div class="course-credits">{{ course.credits }} credits</div>
          </div>
        </div>
        <div v-else class="page-empty">No courses assigned yet.</div>
      </div>

      <!-- Recent Sessions -->
      <div class="page-section">
        <h2 class="section-title">Recent Sessions</h2>
        <table v-if="recentSessions.length" class="page-table">
          <thead>
            <tr>
              <th>Session</th>
              <th>Course</th>
              <th>Date/Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="session in recentSessions" :key="session.id">
              <td>{{ session.title }}</td>
              <td>{{ session.course?.code || session.course?.name || '-' }}</td>
              <td>{{ formatDateTime(session.startTime) }}</td>
              <td>
                <span class="status-badge" :class="getStatusClass(session.status)">
                  {{ session.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="page-empty">No sessions yet.</div>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* View-specific styles */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
}

.action-card {
  background: white;
  border-radius: 12px;
  padding: 1.75rem 1.25rem;
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

.action-card.card-orange {
  --accent-color: #f59e0b;
  --accent-light: #fbbf24;
}

.action-card.card-teal {
  --accent-color: #14b8a6;
  --accent-light: #2dd4bf;
}

.action-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 0.75rem;
  transition: transform 0.3s ease;
}

.action-card:hover .action-icon {
  transform: scale(1.1);
}

.action-label {
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.action-desc {
  font-size: 0.75rem;
  color: var(--color-grey);
}

.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.session-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.session-title {
  font-weight: 600;
  color: var(--color-dark-grey);
}

.session-course {
  color: var(--color-grey);
  font-size: 0.875rem;
}

.session-time {
  color: #888;
  font-size: 0.875rem;
}

.session-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.attendance-code {
  font-family: monospace;
  font-size: 0.875rem;
  background: #e8f5e9;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  color: #2e7d32;
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
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--color-primary);
}

.course-name {
  color: var(--color-dark-grey);
  margin-top: 0.25rem;
}

.course-credits {
  color: #888;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: capitalize;
}

.status-scheduled {
  background: #e3f2fd;
  color: #1976d2;
}

.status-active {
  background: #e8f5e9;
  color: #388e3c;
}

.status-completed {
  background: #f5f5f5;
  color: var(--color-grey);
}

.status-cancelled {
  background: #ffebee;
  color: #c62828;
}
</style>
