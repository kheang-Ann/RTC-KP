<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { leaveRequestsService, type LeaveRequest, type CreateLeaveRequestDto } from '@/services/leave-requests'
import { enrollmentsService, type Enrollment } from '@/services/enrollments'
import { sessionsService, type Session } from '@/services/sessions'

const leaveRequests = ref<LeaveRequest[]>([])
const enrollments = ref<Enrollment[]>([])
const courseSessions = ref<Session[]>([])
const loading = ref(false)
const error = ref('')
const successMessage = ref('')
const showModal = ref(false)

const form = ref<CreateLeaveRequestDto>({
  courseId: '',
  sessionId: '',
  leaveDate: new Date().toISOString().split('T')[0]!,
  reason: '',
})

const pendingRequests = computed(() => 
  leaveRequests.value.filter((r) => r.status === 'pending')
)

const reviewedRequests = computed(() => 
  leaveRequests.value.filter((r) => r.status !== 'pending')
)

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [leaveData, enrollmentsData] = await Promise.all([
      leaveRequestsService.getMyLeaveRequests(),
      enrollmentsService.getMyEnrollments(),
    ])
    leaveRequests.value = leaveData
    enrollments.value = enrollmentsData.filter((e) => e.status === 'active')
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

async function loadCourseSessions() {
  if (!form.value.courseId) {
    courseSessions.value = []
    return
  }
  try {
    const sessions = await sessionsService.getByCourse(form.value.courseId)
    courseSessions.value = sessions
  } catch (e) {
    console.error('Failed to load sessions', e)
  }
}

function openModal() {
  form.value = {
    courseId: '',
    sessionId: '',
    leaveDate: new Date().toISOString().split('T')[0]!,
    reason: '',
  }
  courseSessions.value = []
  showModal.value = true
}

async function submitRequest() {
  if (!form.value.courseId || !form.value.reason || !form.value.leaveDate) {
    error.value = 'Please fill in all required fields'
    return
  }

  loading.value = true
  error.value = ''
  try {
    const dto: CreateLeaveRequestDto = {
      courseId: form.value.courseId,
      leaveDate: form.value.leaveDate,
      reason: form.value.reason,
    }
    if (form.value.sessionId) {
      dto.sessionId = form.value.sessionId
    }
    await leaveRequestsService.create(dto)
    successMessage.value = 'Leave request submitted successfully!'
    showModal.value = false
    setTimeout(() => (successMessage.value = ''), 3000)
    await loadData()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

async function cancelRequest(id: string) {
  if (!confirm('Are you sure you want to cancel this leave request?')) return

  loading.value = true
  error.value = ''
  try {
    await leaveRequestsService.delete(id)
    successMessage.value = 'Leave request cancelled!'
    setTimeout(() => (successMessage.value = ''), 3000)
    await loadData()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function getStatusClass(status: string) {
  const classes: Record<string, string> = {
    pending: 'status-pending',
    approved: 'status-approved',
    rejected: 'status-rejected',
  }
  return classes[status] || ''
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="leave-requests-view">
    <div class="header">
      <h1>Leave Requests</h1>
      <button class="btn btn-primary" @click="openModal">+ New Request</button>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

    <div v-if="loading" class="loading">Loading...</div>

    <template v-else>
      <!-- Pending Requests -->
      <div class="section">
        <h2>Pending Requests ({{ pendingRequests.length }})</h2>
        <div v-if="pendingRequests.length" class="requests-list">
          <div v-for="request in pendingRequests" :key="request.id" class="request-card pending">
            <div class="request-info">
              <div class="request-course">{{ request.course?.code || request.course?.name }}</div>
              <div class="request-date">Leave Date: {{ formatDate(request.leaveDate) }}</div>
              <div class="request-reason">{{ request.reason }}</div>
              <div class="request-meta">Submitted: {{ formatDateTime(request.createdAt) }}</div>
            </div>
            <div class="request-actions">
              <span class="status-badge" :class="getStatusClass(request.status)">{{ request.status }}</span>
              <button class="btn btn-sm btn-danger" @click="cancelRequest(request.id)">Cancel</button>
            </div>
          </div>
        </div>
        <div v-else class="empty">No pending leave requests.</div>
      </div>

      <!-- Reviewed Requests -->
      <div class="section">
        <h2>History ({{ reviewedRequests.length }})</h2>
        <div v-if="reviewedRequests.length" class="requests-list">
          <div v-for="request in reviewedRequests" :key="request.id" class="request-card" :class="request.status">
            <div class="request-info">
              <div class="request-course">{{ request.course?.code || request.course?.name }}</div>
              <div class="request-date">Leave Date: {{ formatDate(request.leaveDate) }}</div>
              <div class="request-reason">{{ request.reason }}</div>
              <div v-if="request.reviewNote" class="request-review-note">
                <strong>Review Note:</strong> {{ request.reviewNote }}
              </div>
              <div class="request-meta">
                Reviewed by {{ request.reviewedBy?.firstName }} {{ request.reviewedBy?.lastName }}
                on {{ formatDateTime(request.reviewedAt!) }}
              </div>
            </div>
            <div class="request-actions">
              <span class="status-badge" :class="getStatusClass(request.status)">{{ request.status }}</span>
            </div>
          </div>
        </div>
        <div v-else class="empty">No reviewed requests yet.</div>
      </div>
    </template>

    <!-- New Request Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <h2>Submit Leave Request</h2>
        <form @submit.prevent="submitRequest">
          <div class="form-group">
            <label>Course *</label>
            <select v-model="form.courseId" required @change="loadCourseSessions">
              <option value="" disabled>Select a course</option>
              <option v-for="enrollment in enrollments" :key="enrollment.courseId" :value="enrollment.courseId">
                {{ enrollment.course?.code || enrollment.course?.name }} - {{ enrollment.course?.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Session (optional)</label>
            <select v-model="form.sessionId">
              <option value="">No specific session</option>
              <option v-for="session in courseSessions" :key="session.id" :value="session.id">
                {{ session.title }} - {{ formatDateTime(session.startTime) }}
              </option>
            </select>
            <small>Select if requesting leave for a specific session</small>
          </div>
          <div class="form-group">
            <label>Leave Date *</label>
            <input v-model="form.leaveDate" type="date" required />
          </div>
          <div class="form-group">
            <label>Reason *</label>
            <textarea v-model="form.reason" required placeholder="Please explain the reason for your leave request..." rows="4"></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn" @click="showModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">Submit Request</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.leave-requests-view {
  padding: 1rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.header h1 {
  margin: 0;
}

.section {
  margin-bottom: 2rem;
}

.section h2 {
  font-size: 1.125rem;
  margin-bottom: 1rem;
  color: #333;
}

.requests-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.request-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #ddd;
}

.request-card.pending {
  border-left-color: #f59e0b;
}

.request-card.approved {
  border-left-color: #22c55e;
}

.request-card.rejected {
  border-left-color: #ef4444;
}

.request-course {
  font-weight: 600;
  color: #4f46e5;
  font-size: 1rem;
}

.request-date {
  color: #333;
  margin-top: 0.25rem;
}

.request-reason {
  color: #666;
  margin-top: 0.5rem;
  font-size: 0.875rem;
}

.request-review-note {
  background: #f5f5f5;
  padding: 0.5rem;
  border-radius: 4px;
  margin-top: 0.5rem;
  font-size: 0.875rem;
}

.request-meta {
  color: #888;
  font-size: 0.75rem;
  margin-top: 0.5rem;
}

.request-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: capitalize;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-approved {
  background: #dcfce7;
  color: #166534;
}

.status-rejected {
  background: #fee2e2;
  color: #991b1b;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s;
}

.btn-primary {
  background: #4f46e5;
  color: white;
}

.btn-primary:hover {
  background: #4338ca;
}

.btn-primary:disabled {
  background: #a5a5a5;
  cursor: not-allowed;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.alert {
  padding: 0.75rem 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.alert-error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.alert-success {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
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
  padding: 1.5rem;
  border-radius: 8px;
  min-width: 400px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h2 {
  margin: 0 0 1.5rem 0;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 500;
}

.form-group select,
.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.875rem;
}

.form-group small {
  display: block;
  margin-top: 0.25rem;
  color: #888;
  font-size: 0.75rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
}
</style>
