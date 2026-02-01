<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { schedulesService, type Schedule } from '@/services/schedules'
import { attendanceService, type Attendance } from '@/services/attendance'
import { authService } from '@/services/auth'

const schedules = ref<Schedule[]>([])
const attendances = ref<Attendance[]>([])
const loading = ref(false)
const error = ref('')

const user = computed(() => authService.getUser())

const stats = computed(() => {
  const total = attendances.value.length
  const present = attendances.value.filter((a) => a.status === 'present').length
  const late = attendances.value.filter((a) => a.status === 'late').length
  const absent = attendances.value.filter((a) => a.status === 'absent').length
  const excused = attendances.value.filter((a) => a.status === 'excused').length
  const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0

  return { total, present, late, absent, excused, attendanceRate }
})

const recentAttendances = computed(() => {
  return [...attendances.value]
    .sort((a, b) => new Date(b.checkInTime || '').getTime() - new Date(a.checkInTime || '').getTime())
    .slice(0, 5)
})

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [schedulesData, attendancesData] = await Promise.all([
      schedulesService.getMySchedule(1), // Default to semester 1
      attendanceService.getMyAttendance(),
    ])
    schedules.value = schedulesData
    attendances.value = attendancesData
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function getStatusClass(status: string) {
  const classes: Record<string, string> = {
    present: 'status-present',
    late: 'status-late',
    absent: 'status-absent',
    excused: 'status-excused',
  }
  return classes[status] || ''
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-US', {
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
    <div class="page-header">
      <h1 class="page-title">Welcome, {{ user?.nameLatin || user?.nameKhmer || user?.email }}</h1>
      <p class="page-subtitle">Student Dashboard</p>
    </div>

    <div v-if="error" class="page-alert page-alert-error">{{ error }}</div>

    <div v-if="loading" class="page-loading">Loading...</div>

    <template v-else>
      <!-- Stats Cards -->
      <div class="page-stats-grid">
        <div class="stat-card border-left-blue">
          <div class="stat-value">{{ new Set(schedules.map((s: Schedule) => s.courseId)).size }}</div>
          <div class="stat-label">Enrolled Courses</div>
        </div>
        <div class="stat-card border-left-lightblue">
          <div class="stat-value">{{ stats.attendanceRate }}%</div>
          <div class="stat-label">Attendance Rate</div>
        </div>
        <div class="stat-card border-left-green stat-success">
          <div class="stat-value">{{ stats.present }}</div>
          <div class="stat-label">Present</div>
        </div>
        <div class="stat-card border-left-orange">
          <div class="stat-value">{{ stats.late }}</div>
          <div class="stat-label">Late</div>
        </div>
        <div class="stat-card border-left-lightred">
          <div class="stat-value">{{ stats.absent }}</div>
          <div class="stat-label">Absent</div>
        </div>
        <div class="stat-card border-left-lightpurple">
          <div class="stat-value">{{ stats.excused }}</div>
          <div class="stat-label">Excused</div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="page-section">
        <h2 class="section-title">Quick Actions</h2>
        <div class="quick-actions">
          <router-link to="/student/check-in" class="action-card card-blue">
            <span class="action-icon">✓</span>
            <span class="action-label">Check In</span>
            <span class="action-desc">Mark attendance</span>
          </router-link>
          <router-link to="/student/attendance" class="action-card card-green">
            <span class="action-icon">📊</span>
            <span class="action-label">Attendance</span>
            <span class="action-desc">View records</span>
          </router-link>
          <router-link to="/student/courses" class="action-card card-purple">
            <span class="action-icon">📚</span>
            <span class="action-label">Courses</span>
            <span class="action-desc">My schedule</span>
          </router-link>
          <router-link to="/student/leave-requests" class="action-card card-orange">
            <span class="action-icon">📝</span>
            <span class="action-label">Leave</span>
            <span class="action-desc">Request leave</span>
          </router-link>
        </div>
      </div>

      <!-- My Courses -->
      <div class="page-section">
        <h2 class="section-title">My Courses</h2>
        <div v-if="schedules.length" class="courses-grid">
          <div v-for="schedule in schedules.filter((s, i, arr) => arr.findIndex((x) => x.courseId === s.courseId) === i).slice(0, 6)" :key="schedule.id" class="course-card">
            <div class="course-code">{{ schedule.course?.code || 'N/A' }}</div>
            <div class="course-name">{{ schedule.course?.name || 'Unknown Course' }}</div>
            <div class="course-status active">Active</div>
          </div>
        </div>
        <div v-else class="page-empty">No courses scheduled yet.</div>
      </div>

      <!-- Recent Attendance -->
      <div class="page-section">
        <h2 class="section-title">Recent Attendance</h2>
        <table v-if="recentAttendances.length" class="page-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Course</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="attendance in recentAttendances" :key="attendance.id">
              <td>{{ formatDate(attendance.checkInTime) }}</td>
              <td>{{ attendance.session?.course?.name || '-' }}</td>
              <td>
                <span class="status-badge" :class="getStatusClass(attendance.status)">
                  {{ attendance.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="page-empty">No attendance records yet.</div>
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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 12px;
  padding: 1.75rem 1.25rem;
  text-decoration: none;
  color: var(--color-dark-grey);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
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

.action-icon {
  font-size: 2.5rem;
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
  color: var(--color-dark-grey);
}

.action-desc {
  font-size: 0.75rem;
  color: var(--color-grey);
  text-align: center;
}

.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.course-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.course-code {
  font-size: 0.75rem;
  color: var(--color-grey);
  text-transform: uppercase;
}

.course-name {
  font-weight: 600;
  margin: 0.25rem 0;
}

.course-status {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  display: inline-block;
}

.course-status.active {
  background: #d4edda;
  color: #155724;
}

.course-status.completed {
  background: #cce5ff;
  color: #004085;
}

.course-status.dropped {
  background: #f8d7da;
  color: #721c24;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: capitalize;
}

.status-present { background: #d4edda; color: #155724; }
.status-late { background: #fff3cd; color: #856404; }
.status-absent { background: #f8d7da; color: #721c24; }
.status-excused { background: #cce5ff; color: #004085; }
</style>
