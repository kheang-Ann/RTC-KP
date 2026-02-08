<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { attendanceService, type Attendance, type AttendanceStatus } from '@/services/attendance'
import { sessionsService, type Session } from '@/services/sessions'
import { coursesService, type Course } from '@/services/courses'

const attendances = ref<Attendance[]>([])
const sessions = ref<Session[]>([])
const courses = ref<Course[]>([])
const selectedCourse = ref<string>('')
const selectedSession = ref<string>('')
const loading = ref(false)
const error = ref('')

const statuses: AttendanceStatus[] = ['present', 'absent', 'late', 'excused']

const filteredSessions = computed(() => {
  if (!selectedCourse.value) return sessions.value
  return sessions.value.filter((s) => s.courseId === selectedCourse.value)
})

onMounted(async () => {
  await loadInitialData()
})

async function loadInitialData() {
  loading.value = true
  error.value = ''
  try {
    const [coursesData, sessionsData] = await Promise.all([
      coursesService.getAll(),
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

async function loadAttendance() {
  if (!selectedSession.value) {
    attendances.value = []
    return
  }
  loading.value = true
  error.value = ''
  try {
    attendances.value = await attendanceService.getBySession(selectedSession.value)
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

async function updateStatus(attendance: Attendance, status: AttendanceStatus) {
  loading.value = true
  error.value = ''
  try {
    await attendanceService.update(attendance.id, { status })
    await loadAttendance()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

async function deleteAttendance(id: string) {
  if (!confirm('Are you sure you want to delete this attendance record?')) return
  loading.value = true
  try {
    await attendanceService.delete(id)
    await loadAttendance()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function getStatusClass(status: AttendanceStatus) {
  const classes: Record<AttendanceStatus, string> = {
    present: 'status-present',
    absent: 'status-absent',
    late: 'status-late',
    excused: 'status-excused',
  }
  return classes[status]
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString()
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">Attendance Management</h1>
    </div>

    <div v-if="error" class="page-alert page-alert-error">{{ error }}</div>

    <!-- Filters -->
    <div class="page-filters">
      <div class="filter-group">
        <label>Course</label>
        <select v-model="selectedCourse">
          <option value="">All Courses</option>
          <option v-for="course in courses" :key="course.id" :value="course.id">
            {{ course.code }} - {{ course.name }}
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label>Session</label>
        <select v-model="selectedSession" @change="loadAttendance">
          <option value="">Select a session</option>
          <option v-for="session in filteredSessions" :key="session.id" :value="session.id">
            {{ formatDate(session.startTime) }} - {{ session.title || 'No title' }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="page-loading">Loading...</div>

    <!-- Attendance Table -->
    <table class="page-table" v-if="attendances.length">
      <thead>
        <tr>
          <th>Student</th>
          <th>Status</th>
          <th>Check-in Time</th>
          <th>Remarks</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="att in attendances" :key="att.id">
          <td>{{ att.student?.nameLatin || att.student?.nameKhmer || '-' }}</td>
          <td>
            <select
              :value="att.status"
              @change="updateStatus(att, ($event.target as HTMLSelectElement).value as AttendanceStatus)"
              class="status-select"
              :class="getStatusClass(att.status)"
            >
              <option v-for="status in statuses" :key="status" :value="status">
                {{ status.charAt(0).toUpperCase() + status.slice(1) }}
              </option>
            </select>
          </td>
          <td>{{ att.checkInTime ? new Date(att.checkInTime).toLocaleTimeString() : '-' }}</td>
          <td>{{ att.remarks || '-' }}</td>
          <td>
            <button class="btn btn-sm btn-danger" @click="deleteAttendance(att.id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else-if="selectedSession && !loading" class="page-empty">
      No attendance records found for this session.
    </div>
    <div v-else-if="!selectedSession && !loading" class="page-empty">
      Select a session to view attendance records.
    </div>
  </div>
</template>

<style scoped>
/* Status select styles */
.status-select {
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid transparent;
  cursor: pointer;
}

.status-present {
  background: #d1fae5;
  color: #065f46;
}

.status-absent {
  background: #fee2e2;
  color: #b91c1c;
}

.status-late {
  background: #fef3c7;
  color: #92400e;
}

.status-excused {
  background: #dbeafe;
  color: #1e40af;
}
</style>
