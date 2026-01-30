<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  leaveRequestsService,
  type LeaveRequest,
  type CreateLeaveRequestDto,
  type LeaveType,
} from '@/services/leave-requests'

const leaveRequests = ref<LeaveRequest[]>([])
const loading = ref(false)
const error = ref('')
const successMessage = ref('')
const showModal = ref(false)
const documentFile = ref<File | null>(null)

const leaveTypes: { value: LeaveType; label: string }[] = [
  { value: 'sick', label: 'Sick Leave' },
  { value: 'annual', label: 'Annual Leave' },
  { value: 'emergency', label: 'Emergency Leave' },
  { value: 'other', label: 'Other' },
]

const form = ref<CreateLeaveRequestDto>({
  leaveType: 'sick',
  startDate: new Date().toISOString().split('T')[0]!,
  endDate: new Date().toISOString().split('T')[0]!,
  reason: '',
})

const totalDays = computed(() => {
  if (!form.value.startDate || !form.value.endDate) return 0
  const start = new Date(form.value.startDate)
  const end = new Date(form.value.endDate)
  if (end < start) return 0
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
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
    leaveRequests.value = await leaveRequestsService.getMyLeaveRequests()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function openModal() {
  form.value = {
    leaveType: 'sick',
    startDate: new Date().toISOString().split('T')[0]!,
    endDate: new Date().toISOString().split('T')[0]!,
    reason: '',
  }
  documentFile.value = null
  showModal.value = true
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    documentFile.value = target.files[0]!
  } else {
    documentFile.value = null
  }
}

async function submitRequest() {
  if (!form.value.reason || !form.value.startDate || !form.value.endDate) {
    error.value = 'Please fill in all required fields'
    return
  }

  if (new Date(form.value.endDate) < new Date(form.value.startDate)) {
    error.value = 'End date cannot be before start date'
    return
  }

  loading.value = true
  error.value = ''
  try {
    await leaveRequestsService.createTeacherRequest(form.value, documentFile.value || undefined)
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

function getLeaveTypeLabel(type: LeaveType) {
  const typeMap: Record<LeaveType, string> = {
    sick: 'Sick Leave',
    annual: 'Annual Leave',
    emergency: 'Emergency Leave',
    other: 'Other',
  }
  return typeMap[type] || type
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
              <div class="request-type">{{ getLeaveTypeLabel(request.leaveType) }}</div>
              <div class="request-date">
                {{ formatDate(request.startDate) }} - {{ formatDate(request.endDate) }}
                <span class="days-badge">({{ request.totalDays }} day{{ request.totalDays > 1 ? 's' : '' }})</span>
              </div>
              <div class="request-reason">{{ request.reason }}</div>
              <div v-if="request.documentPath" class="request-document">
                <a :href="request.documentPath" target="_blank">📎 View Document</a>
              </div>
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
          <div
            v-for="request in reviewedRequests"
            :key="request.id"
            class="request-card"
            :class="request.status"
          >
            <div class="request-info">
              <div class="request-type">{{ getLeaveTypeLabel(request.leaveType) }}</div>
              <div class="request-date">
                {{ formatDate(request.startDate) }} - {{ formatDate(request.endDate) }}
                <span class="days-badge">({{ request.totalDays }} day{{ request.totalDays > 1 ? 's' : '' }})</span>
              </div>
              <div class="request-reason">{{ request.reason }}</div>
              <div v-if="request.documentPath" class="request-document">
                <a :href="request.documentPath" target="_blank">📎 View Document</a>
              </div>
              <div v-if="request.reviewNote" class="request-review-note">
                <strong>{{ request.status === 'rejected' ? 'Rejection Reason:' : 'Review Note:' }}</strong>
                {{ request.reviewNote }}
              </div>
              <div class="request-meta">
                Reviewed by {{ request.reviewedBy?.nameLatin || 'Admin' }}
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
            <label>Leave Type *</label>
            <select v-model="form.leaveType" required>
              <option v-for="type in leaveTypes" :key="type.value" :value="type.value">
                {{ type.label }}
              </option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Start Date *</label>
              <input v-model="form.startDate" type="date" required />
            </div>
            <div class="form-group">
              <label>End Date *</label>
              <input v-model="form.endDate" type="date" required />
            </div>
          </div>
          <div class="total-days" v-if="totalDays > 0">
            Total: <strong>{{ totalDays }} day{{ totalDays > 1 ? 's' : '' }}</strong>
          </div>
          <div class="form-group">
            <label>Reason *</label>
            <textarea
              v-model="form.reason"
              required
              placeholder="Please explain the reason for your leave request..."
              rows="4"
            ></textarea>
          </div>
          <div class="form-group">
            <label>Supporting Document (optional)</label>
            <input type="file" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" @change="handleFileChange" />
            <small>Accepted formats: JPG, PNG, PDF, DOC, DOCX (max 10MB)</small>
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
  color: var(--color-dark-grey);
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
  border-left-color: var(--color-light-red);
}

.request-type {
  font-weight: 600;
  color: var(--color-purple);
  font-size: 1rem;
}

.request-date {
  color: var(--color-dark-grey);
  margin-top: 0.25rem;
}

.days-badge {
  background: #e5e7eb;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  margin-left: 0.5rem;
}

.request-reason {
  color: var(--color-grey);
  margin-top: 0.5rem;
  font-size: 0.875rem;
}

.request-document {
  margin-top: 0.5rem;
}

.request-document a {
  color: var(--color-purple);
  text-decoration: none;
  font-size: 0.875rem;
}

.request-document a:hover {
  text-decoration: underline;
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
  background: #e5e7eb;
}

.btn-primary {
  background: var(--color-purple);
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
  background: var(--color-light-red);
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
  padding: 1.5rem;
  border-radius: 8px;
  min-width: 450px;
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
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

.total-days {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  color: #0369a1;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
}
</style>
