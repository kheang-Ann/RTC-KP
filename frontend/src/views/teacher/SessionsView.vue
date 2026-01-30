<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { sessionsService, type Session, type CreateSessionDto, type SessionStatus } from '@/services/sessions'
import { coursesService, type Course } from '@/services/courses'
import { departmentsService, type Department } from '@/services/departments'
import { programsService, type Program } from '@/services/programs'

const sessions = ref<Session[]>([])
const courses = ref<Course[]>([])
const departments = ref<Department[]>([])
const programs = ref<Program[]>([])
const selectedDepartment = ref<number | null>(null)
const selectedProgram = ref<number | null>(null)
const selectedCourse = ref<string>('')
const loading = ref(false)
const error = ref('')
const successMessage = ref('')
const showModal = ref(false)
const showCodeModal = ref(false)
const activeSession = ref<Session | null>(null)
const editingSession = ref<Session | null>(null)

const form = ref<CreateSessionDto>({
  title: '',
  description: '',
  courseId: '',
  startTime: '',
  endTime: '',
})

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
})

watch(selectedProgram, () => {
  selectedCourse.value = ''
})

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [sessionsData, coursesData, departmentsData, programsData] = await Promise.all([
      sessionsService.getAll(),
      coursesService.getMyCourses(),
      departmentsService.getAll(),
      programsService.getAll(),
    ])
    sessions.value = sessionsData
    courses.value = coursesData
    departments.value = departmentsData
    programs.value = programsData
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingSession.value = null
  const now = new Date()
  const start = new Date(now.getTime() + 60 * 60 * 1000) // 1 hour from now
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000) // 2 hours after start
  
  form.value = {
    title: '',
    description: '',
    courseId: selectedCourse.value || '',
    startTime: formatDateTimeLocal(start),
    endTime: formatDateTimeLocal(end),
  }
  showModal.value = true
}

function openEdit(session: Session) {
  editingSession.value = session
  form.value = {
    title: session.title,
    description: session.description || '',
    courseId: session.courseId,
    startTime: formatDateTimeLocal(new Date(session.startTime)),
    endTime: formatDateTimeLocal(new Date(session.endTime)),
  }
  showModal.value = true
}

async function saveSession() {
  loading.value = true
  error.value = ''
  try {
    if (editingSession.value) {
      await sessionsService.update(editingSession.value.id, form.value)
      successMessage.value = 'Session updated successfully!'
    } else {
      await sessionsService.create(form.value)
      successMessage.value = 'Session created successfully!'
    }
    showModal.value = false
    setTimeout(() => (successMessage.value = ''), 3000)
    await loadData()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

async function activateSession(session: Session) {
  loading.value = true
  error.value = ''
  try {
    const updated = await sessionsService.activate(session.id)
    activeSession.value = updated
    showCodeModal.value = true
    successMessage.value = 'Session activated!'
    setTimeout(() => (successMessage.value = ''), 3000)
    await loadData()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

async function completeSession(session: Session) {
  if (!confirm('Are you sure you want to complete this session?')) return
  loading.value = true
  error.value = ''
  try {
    await sessionsService.complete(session.id)
    successMessage.value = 'Session completed!'
    setTimeout(() => (successMessage.value = ''), 3000)
    await loadData()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

async function regenerateCode(session: Session) {
  loading.value = true
  error.value = ''
  try {
    const updated = await sessionsService.regenerateCode(session.id)
    activeSession.value = updated
    showCodeModal.value = true
    successMessage.value = 'Code regenerated!'
    setTimeout(() => (successMessage.value = ''), 3000)
    await loadData()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

async function deleteSession(id: string) {
  if (!confirm('Are you sure you want to delete this session?')) return
  loading.value = true
  try {
    await sessionsService.delete(id)
    successMessage.value = 'Session deleted!'
    setTimeout(() => (successMessage.value = ''), 3000)
    await loadData()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function showCode(session: Session) {
  activeSession.value = session
  showCodeModal.value = true
}

function formatDateTimeLocal(date: Date): string {
  return date.toISOString().slice(0, 16)
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString()
}

function getStatusClass(status: SessionStatus) {
  const classes: Record<SessionStatus, string> = {
    scheduled: 'status-scheduled',
    active: 'status-active',
    completed: 'status-completed',
    cancelled: 'status-cancelled',
  }
  return classes[status]
}

function getStatusLabel(status: SessionStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}
</script>

<template>
  <div class="container">
    <div class="header">
      <h1>Sessions Management</h1>
      <button class="btn btn-primary" @click="openCreate">+ Create Session</button>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

    <!-- Filter -->
    <div class="filters">
      <div class="filter-group">
        <label>Filter by Department</label>
        <select v-model="selectedDepartment">
          <option :value="null">All Departments</option>
          <option v-for="dept in departments" :key="dept.id" :value="dept.id">
            {{ dept.name }}
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label>Filter by Program</label>
        <select v-model="selectedProgram" :disabled="!selectedDepartment">
          <option :value="null">All Programs</option>
          <option v-for="program in filteredPrograms" :key="program.id" :value="program.id">
            {{ program.name }}
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label>Filter by Course</label>
        <select v-model="selectedCourse" :disabled="!selectedDepartment">
          <option value="">All Courses</option>
          <option v-for="course in filteredCourses" :key="course.id" :value="course.id">
            {{ course.code || course.name }} - {{ course.name }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading...</div>

    <!-- Sessions Table -->
    <table class="table" v-if="filteredSessions.length">
      <thead>
        <tr>
          <th>Title</th>
          <th>Course</th>
          <th>Start Time</th>
          <th>End Time</th>
          <th>Status</th>
          <th>Code</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="session in filteredSessions" :key="session.id">
          <td>{{ session.title }}</td>
          <td>{{ session.course?.name || '-' }}</td>
          <td>{{ formatDateTime(session.startTime) }}</td>
          <td>{{ formatDateTime(session.endTime) }}</td>
          <td>
            <span class="status-badge" :class="getStatusClass(session.status)">
              {{ getStatusLabel(session.status) }}
            </span>
          </td>
          <td>
            <button 
              v-if="session.status === 'active'" 
              class="btn btn-sm btn-code" 
              @click="showCode(session)"
            >
              {{ session.attendanceCode }}
            </button>
            <span v-else class="code-inactive">-</span>
          </td>
          <td class="actions">
            <button 
              v-if="session.status === 'scheduled'" 
              class="btn btn-sm btn-success" 
              @click="activateSession(session)"
            >
              Activate
            </button>
            <button 
              v-if="session.status === 'active'" 
              class="btn btn-sm btn-warning" 
              @click="completeSession(session)"
            >
              Complete
            </button>
            <button 
              v-if="session.status === 'active'" 
              class="btn btn-sm" 
              @click="regenerateCode(session)"
            >
              New Code
            </button>
            <button class="btn btn-sm" @click="openEdit(session)">Edit</button>
            <button class="btn btn-sm btn-danger" @click="deleteSession(session.id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else-if="!loading" class="empty">
      No sessions found. Create your first session!
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <h2>{{ editingSession ? 'Edit Session' : 'Create Session' }}</h2>
        <form @submit.prevent="saveSession">
          <div class="form-group">
            <label>Title</label>
            <input v-model="form.title" type="text" required placeholder="e.g., Week 1 - Introduction" />
          </div>
          <div class="form-group">
            <label>Description (optional)</label>
            <textarea v-model="form.description" placeholder="Session description..."></textarea>
          </div>
          <div class="form-group">
            <label>Course</label>
            <select v-model="form.courseId" required>
              <option value="" disabled>Select a course</option>
              <option v-for="course in courses" :key="course.id" :value="course.id">
                {{ course.code || course.name }} - {{ course.name }} ({{ course.department?.name || 'No Dept' }})
              </option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Start Time</label>
              <input v-model="form.startTime" type="datetime-local" required />
            </div>
            <div class="form-group">
              <label>End Time</label>
              <input v-model="form.endTime" type="datetime-local" required />
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn" @click="showModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ editingSession ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Attendance Code Modal -->
    <div v-if="showCodeModal && activeSession" class="modal-overlay" @click.self="showCodeModal = false">
      <div class="modal code-modal">
        <h2>Attendance Code</h2>
        <p class="session-title">{{ activeSession.title }}</p>
        <div class="attendance-code">
          {{ activeSession.attendanceCode }}
        </div>
        <p class="code-instruction">Share this code with students to check in</p>
        <div class="modal-actions">
          <button class="btn" @click="showCodeModal = false">Close</button>
          <button class="btn btn-primary" @click="regenerateCode(activeSession)">
            Regenerate Code
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filters {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-group label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.filter-group select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  min-width: 200px;
}

.table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.table th,
.table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  background: #e5e7eb;
  color: #374151;
}

.btn:hover {
  background: #d1d5db;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover {
  background: #059669;
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-warning:hover {
  background: #d97706;
}

.btn-danger {
  background: var(--color-light-red);
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.btn-code {
  background: #8b5cf6;
  color: white;
  font-family: monospace;
  font-weight: bold;
}

.btn-code:hover {
  background: #7c3aed;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-scheduled {
  background: #e0e7ff;
  color: #3730a3;
}

.status-active {
  background: #d1fae5;
  color: #065f46;
}

.status-completed {
  background: #f3f4f6;
  color: #374151;
}

.status-cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.code-inactive {
  color: #9ca3af;
}

.alert {
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
}

.alert-error {
  background: #fee2e2;
  color: #991b1b;
}

.alert-success {
  background: #d1fae5;
  color: #065f46;
}

.loading,
.empty {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
  background: white;
  border-radius: 8px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 24px;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h2 {
  margin: 0 0 20px 0;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.form-group textarea {
  min-height: 80px;
  resize: vertical;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.code-modal {
  text-align: center;
}

.session-title {
  color: #6b7280;
  margin-bottom: 16px;
}

.attendance-code {
  font-size: 48px;
  font-weight: bold;
  font-family: monospace;
  color: #8b5cf6;
  background: #f5f3ff;
  padding: 24px;
  border-radius: 12px;
  letter-spacing: 8px;
  margin-bottom: 16px;
}

.code-instruction {
  color: #6b7280;
  font-size: 14px;
}
</style>
