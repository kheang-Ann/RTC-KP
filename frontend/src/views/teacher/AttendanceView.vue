<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import {
  attendanceService,
  type Attendance,
  type AttendanceStatus,
  type BulkAttendanceItem,
} from '@/services/attendance'
import { sessionsService, type Session } from '@/services/sessions'
import { coursesService, type Course } from '@/services/courses'
import { schedulesService, type Schedule } from '@/services/schedules'
import { groupsService, type AvailableStudent } from '@/services/groups'
import { departmentsService, type Department } from '@/services/departments'
import { programsService, type Program } from '@/services/programs'
import { authService } from '@/services/auth'
import { isValidRemarks } from '@/utils/validation'

const attendances = ref<Attendance[]>([])
const sessions = ref<Session[]>([])
const courses = ref<Course[]>([])
const schedules = ref<Schedule[]>([])
const enrolledStudents = ref<AvailableStudent[]>([])
const departments = ref<Department[]>([])
const programs = ref<Program[]>([])
const selectedDepartment = ref<number | null>(null)
const selectedProgram = ref<number | null>(null)
const selectedCourse = ref<string>('')
const selectedSession = ref<string>('')
const loading = ref(false)
const error = ref('')
const successMessage = ref('')

// Get current user's department
const currentUser = authService.getUser()
const userDepartmentId = currentUser?.departmentId ?? null

const statuses: AttendanceStatus[] = ['present', 'absent', 'late', 'excused']

// For bulk marking
const bulkAttendances = ref<Record<number, { status: AttendanceStatus; remarks: string }>>({})

// For selective bulk update
const selectedStudentIds = ref<Set<number>>(new Set())

const filteredPrograms = computed(() => {
  if (!selectedDepartment.value) return programs.value
  return programs.value.filter((p) => p.departmentId === selectedDepartment.value)
})

const filteredCourses = computed(() => {
  if (!selectedDepartment.value) return courses.value
  return courses.value.filter((c) => c.departmentId === selectedDepartment.value)
})

const filteredSessions = computed(() => {
  if (!selectedCourse.value) return sessions.value
  return sessions.value.filter((s) => s.courseId === selectedCourse.value)
})

// Reset selections when parent filter changes
watch(selectedDepartment, () => {
  selectedProgram.value = null
  selectedCourse.value = ''
  selectedSession.value = ''
  attendances.value = []
})

watch(selectedProgram, () => {
  selectedCourse.value = ''
  selectedSession.value = ''
  attendances.value = []
})

onMounted(async () => {
  await loadInitialData()
})

async function loadInitialData() {
  loading.value = true
  error.value = ''
  try {
    // Load only teacher's assigned courses and schedules
    const [coursesData, sessionsData, schedulesData, departmentsData, programsData] = await Promise.all([
      coursesService.getMyCourses(),
      sessionsService.getAll(),
      schedulesService.getMyTeachingSchedule(1), // Default to semester 1
      departmentsService.getAll(),
      programsService.getAll(),
    ])
    courses.value = coursesData
    sessions.value = sessionsData
    schedules.value = schedulesData
    // Filter departments to only show the teacher's department
    departments.value = userDepartmentId
      ? departmentsData.filter((d) => d.id === userDepartmentId)
      : departmentsData
    // Filter programs to only show programs in the teacher's department
    programs.value = userDepartmentId
      ? programsData.filter((p) => p.departmentId === userDepartmentId)
      : programsData
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

async function onCourseChange() {
  selectedSession.value = ''
  attendances.value = []
  enrolledStudents.value = []
  if (selectedCourse.value) {
    try {
      // Get schedules for this course to find groups
      const courseSchedules = schedules.value.filter(s => s.courseId === selectedCourse.value)
      const groupIds = [...new Set(courseSchedules.map(s => s.groupId))]
      
      // Fetch students from all groups
      const studentsPromises = groupIds.map(groupId => groupsService.getStudentsInGroup(groupId))
      const studentsArrays = await Promise.all(studentsPromises)
      
      // Flatten and deduplicate
      const allStudents = studentsArrays.flat()
      enrolledStudents.value = Array.from(
        new Map(allStudents.map(s => [s.id, s])).values()
      )
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
    for (const student of enrolledStudents.value) {
      const existing = attendances.value.find((a) => a.studentId === student.id)
      if (!existing) {
        bulkAttendances.value[student.id] = { status: 'present', remarks: '' }
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

// Mark selected students only
function markSelectedAs(status: AttendanceStatus) {
  if (selectedStudentIds.value.size === 0) {
    error.value = 'Please select at least one student'
    return
  }
  for (const studentId of selectedStudentIds.value) {
    const entry = bulkAttendances.value[studentId]
    if (entry) {
      entry.status = status
    }
  }
}

// Toggle student selection
function toggleStudentSelection(studentId: number) {
  if (selectedStudentIds.value.has(studentId)) {
    selectedStudentIds.value.delete(studentId)
  } else {
    selectedStudentIds.value.add(studentId)
  }
}

// Check if all unmarked students are selected
const isAllUnmarkedSelected = computed(() => {
  const unmarkedIds = Object.keys(bulkAttendances.value).map(id => parseInt(id))
  return unmarkedIds.length > 0 && unmarkedIds.every(id => selectedStudentIds.value.has(id))
})

// Toggle select all unmarked students
function toggleSelectAllUnmarked() {
  const unmarkedIds = Object.keys(bulkAttendances.value).map(id => parseInt(id))
  if (isAllUnmarkedSelected.value) {
    unmarkedIds.forEach(id => selectedStudentIds.value.delete(id))
  } else {
    unmarkedIds.forEach(id => selectedStudentIds.value.add(id))
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

function getRemarksError(studentId: number): string | null {
  const entry = bulkAttendances.value[studentId]
  if (entry?.remarks) {
    return isValidRemarks(entry.remarks)
  }
  return null
}

function hasValidationErrors(): boolean {
  for (const studentId of Object.keys(bulkAttendances.value)) {
    const entry = bulkAttendances.value[parseInt(studentId)]
    if (entry?.remarks && isValidRemarks(entry.remarks)) {
      return true
    }
  }
  return false
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">Manage Attendance</h1>
    </div>

    <div v-if="error" class="page-alert page-alert-error">{{ error }}</div>
    <div v-if="successMessage" class="page-alert page-alert-success">{{ successMessage }}</div>

    <!-- Filters -->
    <div class="page-filters">
      <div class="filter-group">
        <label>Select Department</label>
        <select v-model="selectedDepartment">
          <option :value="null">Choose a department</option>
          <option v-for="dept in departments" :key="dept.id" :value="dept.id">
            {{ dept.name }}
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label>Select Program</label>
        <select v-model="selectedProgram" :disabled="!selectedDepartment">
          <option :value="null">Choose a program</option>
          <option v-for="program in filteredPrograms" :key="program.id" :value="program.id">
            {{ program.name }}
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label>Select Course</label>
        <select v-model="selectedCourse" @change="onCourseChange" :disabled="!selectedDepartment">
          <option value="">Choose a course</option>
          <option v-for="course in filteredCourses" :key="course.id" :value="course.id">
            {{ course.code }} - {{ course.name }}
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label>Select Session</label>
        <select v-model="selectedSession" @change="loadAttendance" :disabled="!selectedCourse">
          <option value="">Choose a session</option>
          <option v-for="session in filteredSessions" :key="session.id" :value="session.id">
            {{ formatDate(session.startTime) }} - {{ session.title || 'No title' }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="page-loading">Loading...</div>

    <!-- Existing Attendance Records -->
    <div v-if="attendances.length && selectedSession" class="page-section">
      <h2 class="section-title">Current Attendance Records</h2>
      <table class="page-table">
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
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mark Attendance for Unmarked Students -->
    <div v-if="Object.keys(bulkAttendances).length && selectedSession" class="page-section">
      <h2 class="section-title">Mark Attendance for Remaining Students</h2>
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
      <div v-if="selectedStudentIds.size > 0" class="bulk-actions selected-actions">
        <span>Mark {{ selectedStudentIds.size }} selected as:</span>
        <button
          v-for="status in statuses"
          :key="'selected-' + status"
          class="btn btn-sm"
          :class="getStatusClass(status)"
          @click="markSelectedAs(status)"
        >
          {{ status.charAt(0).toUpperCase() + status.slice(1) }}
        </button>
      </div>
      <table class="page-table">
        <thead>
          <tr>
            <th>
              <input 
                type="checkbox" 
                :checked="isAllUnmarkedSelected" 
                @change="toggleSelectAllUnmarked"
                title="Select All"
              />
            </th>
            <th>Student</th>
            <th>Status</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="student in enrolledStudents" :key="student.id">
            <template v-if="bulkAttendances[student.id]">
              <td>
                <input 
                  type="checkbox" 
                  :checked="selectedStudentIds.has(student.id)" 
                  @change="toggleStudentSelection(student.id)"
                />
              </td>
              <td>{{ student.nameLatin || student.nameKhmer || '-' }}</td>
              <td>
                <select
                  v-model="bulkAttendances[student.id]!.status"
                  class="status-select"
                  :class="getStatusClass(bulkAttendances[student.id]!.status)"
                >
                  <option v-for="status in statuses" :key="status" :value="status">
                    {{ status.charAt(0).toUpperCase() + status.slice(1) }}
                  </option>
                </select>
              </td>
              <td>
                <input
                  v-model="bulkAttendances[student.id]!.remarks"
                  type="text"
                  placeholder="Optional remarks (max 500 chars)"
                  class="remarks-input"
                  :class="{ 'input-error': getRemarksError(student.id) }"
                  maxlength="500"
                />
                <span v-if="getRemarksError(student.id)" class="field-error">
                  {{ getRemarksError(student.id) }}
                </span>
              </td>
            </template>
          </tr>
        </tbody>
      </table>
      <div class="submit-section">
        <button
          class="btn btn-primary"
          @click="markBulkAttendance"
          :disabled="loading || hasValidationErrors()"
        >
          Submit Attendance
        </button>
        <span v-if="hasValidationErrors()" class="validation-warning">
          Please fix validation errors before submitting
        </span>
      </div>
    </div>

    <div v-else-if="selectedSession && !loading && !attendances.length" class="page-empty">
      No enrolled students found for this course.
    </div>
    <div v-else-if="!selectedSession && !loading" class="page-empty">
      Select a course and session to manage attendance.
    </div>
  </div>
</template>

<style scoped>
/* View-specific styles */
.bulk-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
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

.remarks-input.input-error {
  border-color: #dc3545;
}

.field-error {
  color: #dc3545;
  font-size: 0.75rem;
  display: block;
  margin-top: 2px;
}

.validation-warning {
  color: #dc3545;
  font-size: 0.875rem;
  margin-left: 12px;
  align-self: center;
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

.submit-section {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
}

.selected-actions {
  background: #eef2ff;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #c7d2fe;
}

.selected-actions span {
  color: #4338ca;
  font-weight: 500;
}
</style>
