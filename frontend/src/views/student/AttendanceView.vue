<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { attendanceService, type Attendance } from '@/services/attendance'
import { schedulesService, type Schedule } from '@/services/schedules'
import { authService } from '@/services/auth'

const attendances = ref<Attendance[]>([])
const schedules = ref<Schedule[]>([])
const selectedCourse = ref<string>('')
const loading = ref(false)
const error = ref('')

const filteredAttendances = computed(() => {
  if (!selectedCourse.value) return attendances.value
  return attendances.value.filter((a) => a.session?.courseId === selectedCourse.value)
})

const stats = computed(() => {
  const list = filteredAttendances.value
  const total = list.length
  const present = list.filter((a) => a.status === 'present').length
  const late = list.filter((a) => a.status === 'late').length
  const absent = list.filter((a) => a.status === 'absent').length
  const excused = list.filter((a) => a.status === 'excused').length
  const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0

  return { total, present, late, absent, excused, attendanceRate }
})

const user = computed(() => authService.getUser())

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [attendancesData, schedulesData] = await Promise.all([
      attendanceService.getMyAttendance(),
      schedulesService.getMySchedule(1), // Default to semester 1
    ])
    attendances.value = attendancesData
    schedules.value = schedulesData
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
    year: 'numeric',
  })
}

function formatTime(dateStr?: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getCourseName(courseId?: string) {
  if (!courseId) return '-'
  const schedule = schedules.value.find((s) => s.courseId === courseId)
  return schedule?.course?.name || courseId
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">My Attendance</h1>
      <p class="page-subtitle">View your attendance history across all courses</p>
    </div>

    <div v-if="error" class="page-alert page-alert-error">{{ error }}</div>

    <!-- Stats Cards -->
    <div class="page-stats-grid">
      <div class="stat-card border-left-lightblue">
        <div class="stat-value">{{ stats.attendanceRate }}%</div>
        <div class="stat-label">Attendance Rate</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-label">Total Sessions</div>
      </div>
      <div class="stat-card stat-success">
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
    </div>

    <!-- Filter -->
    <div class="page-filters">
      <div class="filter-group">
        <label>Filter by Course</label>
        <select v-model="selectedCourse">
          <option value="">All Courses</option>
          <option v-for="schedule in schedules.filter((s, i, arr) => arr.findIndex(x => x.courseId === s.courseId) === i)" :key="schedule.id" :value="schedule.courseId">
            {{ schedule.course?.code || schedule.course?.name }} - {{ schedule.course?.name }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="page-loading">Loading...</div>

    <!-- Attendance Table -->
    <table v-else-if="filteredAttendances.length" class="page-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Time</th>
          <th>Course</th>
          <th>Status</th>
          <th>Remarks</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="attendance in filteredAttendances" :key="attendance.id">
          <td>{{ formatDate(attendance.checkInTime) }}</td>
          <td>{{ formatTime(attendance.checkInTime) }}</td>
          <td>{{ getCourseName(attendance.session?.courseId) }}</td>
          <td>
            <span class="status-badge" :class="getStatusClass(attendance.status)">
              {{ attendance.status }}
            </span>
          </td>
          <td>{{ attendance.remarks || '-' }}</td>
        </tr>
      </tbody>
    </table>

    <div v-else class="page-empty">
      <p>No attendance records found.</p>
      <router-link to="/student/check-in" class="btn btn-primary">Check In Now</router-link>
    </div>
  </div>
</template>

<style scoped>
/* View-specific styles */
.stat-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--color-dark-grey);
}

.stat-label {
  color: var(--color-grey);
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.stat-success {
  border-left: 4px solid #22c55e;
}

.stat-success .stat-value { color: #22c55e; }

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

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}
</style>
