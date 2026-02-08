<script setup lang="ts">
import { ref, onMounted, computed, watch} from 'vue'
import { sessionsService, type Session, type CreateSessionDto, type SessionStatus } from '@/services/sessions'
import { coursesService, type Course } from '@/services/courses'
import { departmentsService, type Department } from '@/services/departments'
import { programsService, type Program } from '@/services/programs'
import { authService } from '@/services/auth'
import QRCode from 'qrcode'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

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
const showDeleteConfirm = ref(false)
const deleteTargetId = ref<string | null>(null)
const activeSession = ref<Session | null>(null)
const editingSession = ref<Session | null>(null)
const qrCodeDataUrl = ref<string>('')
const modalError = ref('')

// Get current user's department
const currentUser = authService.getUser()
const userDepartmentId = currentUser?.departmentId ?? null

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

function openCreate() {
  editingSession.value = null
  modalError.value = ''
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
  modalError.value = ''
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
  modalError.value = ''
  try {
    // Convert local datetime-local values to ISO strings with timezone
    const payload = {
      ...form.value,
      startTime: new Date(form.value.startTime).toISOString(),
      endTime: new Date(form.value.endTime).toISOString(),
    }
    if (editingSession.value) {
      await sessionsService.update(editingSession.value.id, payload)
      successMessage.value = 'Session updated successfully!'
    } else {
      await sessionsService.create(payload)
      successMessage.value = 'Session created successfully!'
    }
    showModal.value = false
    setTimeout(() => (successMessage.value = ''), 3000)
    await loadData()
  } catch (e) {
    modalError.value = (e as Error).message
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
    await generateQRCode(updated.attendanceCode)
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
    await generateQRCode(updated.attendanceCode)
    successMessage.value = 'Code regenerated!'
    setTimeout(() => (successMessage.value = ''), 3000)
    await loadData()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function deleteSession(id: string) {
  deleteTargetId.value = id
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  if (deleteTargetId.value === null) return
  showDeleteConfirm.value = false
  loading.value = true
  try {
    await sessionsService.delete(deleteTargetId.value)
    successMessage.value = 'Session deleted!'
    setTimeout(() => (successMessage.value = ''), 3000)
    await loadData()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
    deleteTargetId.value = null
  }
}

function cancelDelete() {
  showDeleteConfirm.value = false
  deleteTargetId.value = null
}

function showCode(session: Session) {
  activeSession.value = session
  showCodeModal.value = true
  generateQRCode(session.attendanceCode)
}

async function generateQRCode(code: string | undefined) {
  if (!code) {
    qrCodeDataUrl.value = ''
    return
  }
  try {
    qrCodeDataUrl.value = await QRCode.toDataURL(code, {
      width: 200,
      margin: 2,
      color: {
        dark: '#3b82f6',
        light: '#ffffff'
      }
    })
  } catch (err) {
    console.error('Failed to generate QR code:', err)
    qrCodeDataUrl.value = ''
  }
}

function formatDateTimeLocal(date: Date): string {
  // Use local time instead of UTC to avoid AM/PM issues
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-GB', {
    timeZone: 'Asia/Phnom_Penh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
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
  <div class="page-container">
    <div class="page-header-row">
      <h1 class="page-title">Sessions Management</h1>
      <button class="btn btn-primary" @click="openCreate">+ Create Session</button>
    </div>

    <div v-if="error" class="page-alert page-alert-error">{{ error }}</div>
    <div v-if="successMessage" class="page-alert page-alert-success">{{ successMessage }}</div>

    <!-- Filter -->
    <div class="page-filters">
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

    <div v-if="loading" class="page-loading">Loading...</div>

    <!-- Sessions Table -->
    <table class="page-table" v-if="filteredSessions.length">
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
            <button class="btn btn-sm btn-secondary" @click="openEdit(session)">Edit</button>
            <button class="btn btn-sm btn-danger" @click="deleteSession(session.id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else-if="!loading" class="page-empty">
      No sessions found. Create your first session!
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <h2>{{ editingSession ? 'Edit Session' : 'Create Session' }}</h2>
        <div v-if="modalError" class="modal-error">{{ modalError }}</div>
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
            <button type="button" class="btn btn-secondary" @click="showModal = false">Cancel</button>
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
        
        <!-- QR Code Section -->
        <div class="qr-code-section">
          <p class="qr-label">Or scan QR Code</p>
          <div class="qr-code-container">
            <img 
              v-if="qrCodeDataUrl" 
              :src="qrCodeDataUrl" 
              alt="Attendance QR Code" 
              class="qr-code-image"
            />
            <div v-else class="qr-loading">Generating QR Code...</div>
          </div>
        </div>
        
        <p class="code-instruction">Share this code or QR with students to check in</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showCodeModal = false">Close</button>
          <button class="btn btn-primary" @click="regenerateCode(activeSession)">
            Regenerate Code
          </button>
        </div>
      </div>
    </div>
  </div>

  <ConfirmDialog
    :show="showDeleteConfirm"
    title="Delete Session"
    message="Are you sure you want to delete this session? This action cannot be undone."
    @confirm="confirmDelete"
    @cancel="cancelDelete"
  />
</template>

<style scoped>
/* View-specific styles */
.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-code {
  background: var(--color-primary);
  color: white;
  font-family: monospace;
  font-weight: bold;
}

.btn-code:hover {
  background: var(--color-primary-dark);
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

/* Modal styles */
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
  padding: 20px;
  overflow-y: auto;
}

.modal {
  background: white;
  padding: 24px;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  box-sizing: border-box;
}

.modal * {
  box-sizing: border-box;
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
  box-sizing: border-box;
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
  color: var(--color-primary);
  background: #eff6ff;
  padding: 24px;
  border-radius: 12px;
  letter-spacing: 8px;
  margin-bottom: 16px;
}

.qr-code-section {
  margin: 20px 0;
}

.qr-label {
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 12px;
}

.qr-code-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
  border: 2px dashed #e5e7eb;
}

.qr-code-image {
  width: 200px;
  height: 200px;
  border-radius: 8px;
}

.qr-loading {
  width: 200px;
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #9ca3af;
  font-size: 14px;
}

.code-instruction {
  color: #6b7280;
  font-size: 14px;
}

.modal-error {
  background: #fee2e2;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  border: 1px solid #fecaca;
}
</style>
