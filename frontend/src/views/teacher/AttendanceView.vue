<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  attendanceService,
  type Attendance,
  type AttendanceStatus,
  type BulkAttendanceItem,
} from '@/services/attendance'
import { sessionsService, type Session } from '@/services/sessions'
import { coursesService, type Course } from '@/services/courses'
import { enrollmentsService, type Enrollment } from '@/services/enrollments'

const attendances = ref<Attendance[]>([])
const sessions = ref<Session[]>([])
const courses = ref<Course[]>([])
const enrollments = ref<Enrollment[]>([])
const selectedCourse = ref<string>('')
const selectedSession = ref<string>('')
const loading = ref(false)
const error = ref('')
const successMessage = ref('')

const statuses: AttendanceStatus[] = ['present', 'absent', 'late', 'excused']

// For bulk marking
const bulkAttendances = ref<Record<number, { status: AttendanceStatus; remarks: string }>>({})

const filteredSessions = computed(() => {
  if (!selectedCourse.value) return sessions.value
  return sessions.value.filter((s) => s.courseId === selectedCourse.value)
})

const enrolledStudents = computed(() => {
  if (!selectedCourse.value) return []
  return enrollments.value.filter((e) => e.courseId === selectedCourse.value)
})

onMounted(async () => {
  await loadInitialData()
})

async function loadInitialData() {
  loading.value = true
  error.value = ''
  try {
    // Load only teacher's assigned courses
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

async function onCourseChange() {
  selectedSession.value = ''
  attendances.value = []
  if (selectedCourse.value) {
    try {
      enrollments.value = await enrollmentsService.getByCourse(selectedCourse.value)
    } catch (e) {
      error.value = (e as Error).message
    }
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

    // Initialize bulk attendances for students not yet marked
    bulkAttendances.value = {}
    for (const enrollment of enrolledStudents.value) {
      const existing = attendances.value.find((a) => a.studentId === enrollment.studentId)
      if (!existing) {
        bulkAttendances.value[enrollment.studentId] = { status: 'present', remarks: '' }
      }
    }
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
    successMessage.value = 'Attendance updated!'
    setTimeout(() => (successMessage.value = ''), 3000)
    await loadAttendance()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

async function markBulkAttendance() {
  if (!selectedSession.value) return

  const items: BulkAttendanceItem[] = Object.entries(bulkAttendances.value).map(
    ([studentId, data]) => ({
      studentId: parseInt(studentId),
      status: data.status,
      remarks: data.remarks || undefined,
    }),
  )

  if (items.length === 0) {
    error.value = 'No students to mark attendance for.'
    return
  }

  loading.value = true
  error.value = ''
  try {
    await attendanceService.bulkMarkAttendance({
      sessionId: selectedSession.value,
      attendances: items,
    })
    successMessage.value = `Attendance marked for ${items.length} students!`
    setTimeout(() => (successMessage.value = ''), 3000)
    await loadAttendance()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function markAllAs(status: AttendanceStatus) {
  for (const studentId of Object.keys(bulkAttendances.value)) {
    const entry = bulkAttendances.value[parseInt(studentId)]
    if (entry) {
      entry.status = status
    }
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
  <div class="container">
    <div class="header">
      <h1>Manage Attendance</h1>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

    <!-- Filters -->
    <div class="filters">
      <div class="filter-group">
        <label>Select Course</label>
        <select v-model="selectedCourse" @change="onCourseChange">
          <option value="">Choose a course</option>
          <option v-for="course in courses" :key="course.id" :value="course.id">
            {{ course.code }} - {{ course.name }}
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label>Select Session</label>
        <select v-model="selectedSession" @change="loadAttendance">
          <option value="">Choose a session</option>
          <option v-for="session in filteredSessions" :key="session.id" :value="session.id">
            {{ formatDate(session.startTime) }} - {{ session.title || 'No title' }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading...</div>

    <!-- Existing Attendance Records -->
    <div v-if="attendances.length && selectedSession" class="section">
      <h2>Current Attendance Records</h2>
      <table class="table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Status</th>
            <th>Check-in Time</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="att in attendances" :key="att.id">
            <td>{{ att.student?.firstName }} {{ att.student?.lastName }}</td>
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
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mark Attendance for Unmarked Students -->
    <div v-if="Object.keys(bulkAttendances).length && selectedSession" class="section">
      <h2>Mark Attendance for Remaining Students</h2>
      <div class="bulk-actions">
        <span>Quick mark all as:</span>
        <button
          v-for="status in statuses"
          :key="status"
          class="btn btn-sm"
          :class="getStatusClass(status)"
          @click="markAllAs(status)"
        >
          {{ status.charAt(0).toUpperCase() + status.slice(1) }}
        </button>
      </div>
      <table class="table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Status</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="enrollment in enrolledStudents" :key="enrollment.studentId">
            <template v-if="bulkAttendances[enrollment.studentId]">
              <td>{{ enrollment.student?.firstName }} {{ enrollment.student?.lastName }}</td>
              <td>
                <select
                  v-model="bulkAttendances[enrollment.studentId].status"
                  class="status-select"
                  :class="getStatusClass(bulkAttendances[enrollment.studentId].status)"
                >
                  <option v-for="status in statuses" :key="status" :value="status">
                    {{ status.charAt(0).toUpperCase() + status.slice(1) }}
                  </option>
                </select>
              </td>
              <td>
                <input
                  v-model="bulkAttendances[enrollment.studentId].remarks"
                  type="text"
                  placeholder="Optional remarks"
                  class="remarks-input"
                />
              </td>
            </template>
          </tr>
        </tbody>
      </table>
      <div class="submit-section">
        <button class="btn btn-primary" @click="markBulkAttendance" :disabled="loading">
          Submit Attendance
        </button>
      </div>
    </div>

    <div v-else-if="selectedSession && !loading && !attendances.length" class="empty">
      No enrolled students found for this course.
    </div>
    <div v-else-if="!selectedSession && !loading" class="empty">
      Select a course and session to manage attendance.
    </div>
  </div>
</template>

<style scoped>
.container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 20px;
}

.section {
  margin-top: 30px;
}

.section h2 {
  font-size: 18px;
  margin-bottom: 16px;
}

.filters {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-group label {
  font-weight: 500;
  font-size: 14px;
}

.filter-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 250px;
}

.bulk-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.table th {
  background-color: #f5f5f5;
  font-weight: 600;
}

.status-select {
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid transparent;
  cursor: pointer;
}

.remarks-input {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 100%;
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

.btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  background: white;
}

.btn-primary {
  background: #4f46e5;
  color: white;
  border-color: #4f46e5;
}

.btn-sm {
  padding: 4px 12px;
}

.submit-section {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.alert-error {
  padding: 12px;
  background: #fee2e2;
  color: #b91c1c;
  border-radius: 4px;
  margin-bottom: 16px;
}

.alert-success {
  padding: 12px;
  background: #d1fae5;
  color: #065f46;
  border-radius: 4px;
  margin-bottom: 16px;
}

.loading,
.empty {
  text-align: center;
  padding: 40px;
  color: #666;
}
</style>
