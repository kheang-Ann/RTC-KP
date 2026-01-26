<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { attendanceService, type Attendance } from '@/services/attendance'
import { enrollmentsService, type Enrollment } from '@/services/enrollments'

const attendances = ref<Attendance[]>([])
const enrollments = ref<Enrollment[]>([])
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

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [attendancesData, enrollmentsData] = await Promise.all([
      attendanceService.getMyAttendance(),
      enrollmentsService.getMyEnrollments(),
    ])
    attendances.value = attendancesData
    enrollments.value = enrollmentsData
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
  const enrollment = enrollments.value.find((e) => e.courseId === courseId)
  return enrollment?.course?.name || courseId
}
</script>

<template>
  <div class="attendance-history">
    <h1>My Attendance</h1>
    <p class="subtitle">View your attendance history across all courses</p>

    <div v-if="error" class="alert alert-error">{{ error }}</div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card stat-primary">
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
      <div class="stat-card stat-warning">
        <div class="stat-value">{{ stats.late }}</div>
        <div class="stat-label">Late</div>
      </div>
      <div class="stat-card stat-danger">
        <div class="stat-value">{{ stats.absent }}</div>
        <div class="stat-label">Absent</div>
      </div>
    </div>

    <!-- Filter -->
    <div class="filters">
      <div class="filter-group">
        <label>Filter by Course</label>
        <select v-model="selectedCourse">
          <option value="">All Courses</option>
          <option v-for="enrollment in enrollments" :key="enrollment.id" :value="enrollment.courseId">
            {{ enrollment.course?.code || enrollment.course?.name }} - {{ enrollment.course?.name }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading...</div>

    <!-- Attendance Table -->
    <table v-else-if="filteredAttendances.length" class="table">
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

    <div v-else class="empty">
      <p>No attendance records found.</p>
      <router-link to="/student/check-in" class="btn btn-primary">Check In Now</router-link>
    </div>
  </div>
</template>

<style scoped>
.attendance-history {
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
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

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
  color: #333;
}

.stat-label {
  color: #666;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.stat-primary .stat-value { color: #007bff; }
.stat-success .stat-value { color: #28a745; }
.stat-warning .stat-value { color: #ffc107; }
.stat-danger .stat-value { color: #dc3545; }

.filters {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.filter-group label {
  font-size: 0.875rem;
  font-weight: 500;
}

.filter-group select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
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
  background: #f8f9fa;
  font-weight: 600;
}

.table tbody tr:hover {
  background: #f8f9fa;
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

.empty {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.empty p {
  margin-bottom: 1rem;
  color: #666;
}

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

.loading {
  text-align: center;
  padding: 2rem;
}

.alert {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.alert-error {
  background: #f8d7da;
  color: #721c24;
}
</style>
