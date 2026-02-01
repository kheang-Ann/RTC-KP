<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  leaveRequestsService,
  type LeaveRequest,
  type ReviewLeaveRequestDto,
  type LeaveType,
  type LeaveRequestWithDetails,
} from '@/services/leave-requests'

const leaveRequests = ref<LeaveRequest[]>([])
const selectedRequesterType = ref<string>('')
const selectedStatus = ref<string>('')
const loading = ref(false)
const error = ref('')
const successMessage = ref('')

// Review modal
const showReviewModal = ref(false)
const reviewingRequest = ref<LeaveRequest | null>(null)
const reviewForm = ref<ReviewLeaveRequestDto>({
  status: 'approved',
  reviewNote: '',
})

// View details modal
const showViewModal = ref(false)
const viewingDetails = ref<LeaveRequestWithDetails | null>(null)
const loadingDetails = ref(false)

// Reject modal
const showRejectModal = ref(false)
const rejectingRequest = ref<LeaveRequest | null>(null)
const rejectReason = ref('')

const leaveTypeLabels: Record<LeaveType, string> = {
  sick: 'Sick Leave',
  annual: 'Annual Leave',
  emergency: 'Emergency Leave',
  other: 'Other',
}

const filteredRequests = computed(() => {
  let result = leaveRequests.value

  if (selectedRequesterType.value) {
    result = result.filter((r) => r.requesterType === selectedRequesterType.value)
  }

  if (selectedStatus.value) {
    result = result.filter((r) => r.status === selectedStatus.value)
  }

  return result
})

const stats = computed(() => ({
  total: leaveRequests.value.length,
  pending: leaveRequests.value.filter((r) => r.status === 'pending').length,
  approved: leaveRequests.value.filter((r) => r.status === 'approved').length,
  rejected: leaveRequests.value.filter((r) => r.status === 'rejected').length,
}))

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    leaveRequests.value = await leaveRequestsService.getAll()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function getRequesterName(request: LeaveRequest) {
  if (request.requesterType === 'student' && request.student) {
    return request.student.nameLatin || request.student.nameKhmer
  }
  if (request.requesterType === 'teacher' && request.teacher) {
    return request.teacher.nameLatin || request.teacher.nameKhmer
  }
  return request.user?.nameLatin || request.user?.email || 'Unknown'
}

async function openViewModal(request: LeaveRequest) {
  loadingDetails.value = true
  showViewModal.value = true
  try {
    viewingDetails.value = await leaveRequestsService.getOneWithDetails(request.id)
  } catch (e) {
    error.value = (e as Error).message
    showViewModal.value = false
  } finally {
    loadingDetails.value = false
  }
}

function openRejectModal(request: LeaveRequest) {
  rejectingRequest.value = request
  rejectReason.value = ''
  showRejectModal.value = true
}

async function submitReview() {
  if (!reviewingRequest.value) return

  loading.value = true
  error.value = ''
  try {
    await leaveRequestsService.review(reviewingRequest.value.id, reviewForm.value)
    successMessage.value = `Leave request ${reviewForm.value.status}!`
    showReviewModal.value = false
    setTimeout(() => (successMessage.value = ''), 3000)
    await loadData()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

async function quickApprove(request: LeaveRequest) {
  if (!confirm('Approve this leave request?')) return

  loading.value = true
  error.value = ''
  try {
    await leaveRequestsService.review(request.id, { status: 'approved' })
    successMessage.value = 'Leave request approved!'
    setTimeout(() => (successMessage.value = ''), 3000)
    await loadData()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

async function submitRejection() {
  if (!rejectingRequest.value) return

  if (!rejectReason.value.trim()) {
    error.value = 'Please provide a reason for rejection'
    return
  }

  loading.value = true
  error.value = ''
  try {
    await leaveRequestsService.review(rejectingRequest.value.id, {
      status: 'rejected',
      reviewNote: rejectReason.value,
    })
    successMessage.value = 'Leave request rejected!'
    showRejectModal.value = false
    setTimeout(() => (successMessage.value = ''), 3000)
    await loadData()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

async function deleteRequest(id: string) {
  if (!confirm('Are you sure you want to delete this leave request?')) return

  loading.value = true
  error.value = ''
  try {
    await leaveRequestsService.delete(id)
    successMessage.value = 'Leave request deleted!'
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
  return leaveTypeLabels[type] || type
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
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">Leave Requests Management</h1>
    </div>

    <div v-if="error" class="page-alert page-alert-error">{{ error }}</div>
    <div v-if="successMessage" class="page-alert page-alert-success">{{ successMessage }}</div>

    <!-- Stats -->
    <div class="page-stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-label">Total</div>
      </div>
      <div class="stat-card border-left-orange">
        <div class="stat-value">{{ stats.pending }}</div>
        <div class="stat-label">Pending</div>
      </div>
      <div class="stat-card stat-success">
        <div class="stat-value">{{ stats.approved }}</div>
        <div class="stat-label">Approved</div>
      </div>
      <div class="stat-card border-left-lightred">
        <div class="stat-value">{{ stats.rejected }}</div>
        <div class="stat-label">Rejected</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="page-filters">
      <div class="filter-group">
        <label>Type</label>
        <select v-model="selectedRequesterType">
          <option value="">All Types</option>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Status</label>
        <select v-model="selectedStatus">
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="page-loading">Loading...</div>

    <template v-else>
      <table v-if="filteredRequests.length" class="page-table">
        <thead>
          <tr>
            <th>Requester</th>
            <th>Type</th>
            <th>Leave Type</th>
            <th>Period</th>
            <th>Days</th>
            <th>Status</th>
            <th>Submitted</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="request in filteredRequests" :key="request.id">
            <td>
              <div class="requester-name">{{ getRequesterName(request) }}</div>
              <div class="requester-type">{{ request.requesterType }}</div>
            </td>
            <td>
              <span class="type-badge" :class="request.requesterType">
                {{ request.requesterType }}
              </span>
            </td>
            <td>{{ getLeaveTypeLabel(request.leaveType) }}</td>
            <td>
              <div class="period">
                {{ formatDate(request.startDate) }}
                <span v-if="request.startDate !== request.endDate">
                  - {{ formatDate(request.endDate) }}
                </span>
              </div>
            </td>
            <td>{{ request.totalDays }}</td>
            <td>
              <span class="status-badge" :class="getStatusClass(request.status)">{{ request.status }}</span>
            </td>
            <td>{{ formatDateTime(request.createdAt) }}</td>
            <td class="actions">
              <button class="btn btn-sm btn-outline" @click="openViewModal(request)">View</button>
              <template v-if="request.status === 'pending'">
                <button class="btn btn-sm btn-success" @click="quickApprove(request)">Approve</button>
                <button class="btn btn-sm btn-danger" @click="openRejectModal(request)">Reject</button>
              </template>
              <button class="btn btn-sm btn-outline-danger" @click="deleteRequest(request.id)">🗑</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="page-empty">No leave requests found.</div>
    </template>

    <!-- View Details Modal -->
    <div v-if="showViewModal" class="modal-overlay" @click.self="showViewModal = false">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h2>Leave Request Details</h2>
          <button class="close-btn" @click="showViewModal = false">&times;</button>
        </div>

        <div v-if="loadingDetails" class="page-loading">Loading details...</div>

        <template v-else-if="viewingDetails">
          <!-- Contact Details -->
          <div class="detail-section">
            <h3>{{ viewingDetails.contactDetails.type }} Information</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <label>Name (Latin)</label>
                <span>{{ viewingDetails.contactDetails.name }}</span>
              </div>
              <div class="detail-item">
                <label>Name (Khmer)</label>
                <span>{{ viewingDetails.contactDetails.nameKhmer }}</span>
              </div>
              <div class="detail-item">
                <label>Email</label>
                <span>{{ viewingDetails.contactDetails.email }}</span>
              </div>
              <div class="detail-item">
                <label>Phone Numbers</label>
                <span>{{ viewingDetails.contactDetails.phoneNumbers?.join(', ') || 'N/A' }}</span>
              </div>
              <div v-if="viewingDetails.contactDetails.emergencyPhoneNumbers?.length" class="detail-item">
                <label>Emergency Contacts</label>
                <span>{{ viewingDetails.contactDetails.emergencyPhoneNumbers.join(', ') }}</span>
              </div>
              <div v-if="viewingDetails.contactDetails.department" class="detail-item">
                <label>Department</label>
                <span>{{ viewingDetails.contactDetails.department }}</span>
              </div>
              <div v-if="viewingDetails.contactDetails.program" class="detail-item">
                <label>Program</label>
                <span>{{ viewingDetails.contactDetails.program }}</span>
              </div>
            </div>
          </div>

          <!-- Leave Information -->
          <div class="detail-section">
            <h3>Leave Information</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <label>Leave Type</label>
                <span>{{ getLeaveTypeLabel(viewingDetails.leaveRequest.leaveType) }}</span>
              </div>
              <div class="detail-item">
                <label>Period</label>
                <span>
                  {{ formatDate(viewingDetails.leaveRequest.startDate) }}
                  <span v-if="viewingDetails.leaveRequest.startDate !== viewingDetails.leaveRequest.endDate">
                    - {{ formatDate(viewingDetails.leaveRequest.endDate) }}
                  </span>
                </span>
              </div>
              <div class="detail-item">
                <label>Total Days</label>
                <span>{{ viewingDetails.leaveRequest.totalDays }} day(s)</span>
              </div>
              <div class="detail-item full-width">
                <label>Reason</label>
                <span>{{ viewingDetails.leaveRequest.reason }}</span>
              </div>
              <div v-if="viewingDetails.leaveRequest.documentPath" class="detail-item">
                <label>Document</label>
                <a :href="viewingDetails.leaveRequest.documentPath" target="_blank" class="document-link">
                  📎 View Attached Document
                </a>
              </div>
              <div class="detail-item">
                <label>Status</label>
                <span class="status-badge" :class="getStatusClass(viewingDetails.leaveRequest.status)">
                  {{ viewingDetails.leaveRequest.status }}
                </span>
              </div>
              <div v-if="viewingDetails.leaveRequest.reviewNote" class="detail-item full-width">
                <label>{{ viewingDetails.leaveRequest.status === 'rejected' ? 'Rejection Reason' : 'Review Note' }}</label>
                <span>{{ viewingDetails.leaveRequest.reviewNote }}</span>
              </div>
              <div v-if="viewingDetails.leaveRequest.reviewedBy" class="detail-item">
                <label>Reviewed By</label>
                <span>{{ viewingDetails.leaveRequest.reviewedBy.nameLatin }}</span>
              </div>
              <div v-if="viewingDetails.leaveRequest.reviewedAt" class="detail-item">
                <label>Reviewed At</label>
                <span>{{ formatDateTime(viewingDetails.leaveRequest.reviewedAt) }}</span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div v-if="viewingDetails.leaveRequest.status === 'pending'" class="modal-actions">
            <button class="btn btn-success" @click="quickApprove(viewingDetails.leaveRequest); showViewModal = false">
              Approve
            </button>
            <button class="btn btn-danger" @click="openRejectModal(viewingDetails.leaveRequest); showViewModal = false">
              Reject
            </button>
          </div>
        </template>
      </div>
    </div>

    <!-- Reject Modal -->
    <div v-if="showRejectModal && rejectingRequest" class="modal-overlay" @click.self="showRejectModal = false">
      <div class="modal">
        <h2>Reject Leave Request</h2>
        
        <div class="reject-info">
          <p><strong>Requester:</strong> {{ getRequesterName(rejectingRequest) }}</p>
          <p><strong>Period:</strong> {{ formatDate(rejectingRequest.startDate) }} - {{ formatDate(rejectingRequest.endDate) }}</p>
          <p><strong>Days:</strong> {{ rejectingRequest.totalDays }}</p>
        </div>

        <form @submit.prevent="submitRejection">
          <div class="form-group">
            <label>Rejection Reason *</label>
            <textarea
              v-model="rejectReason"
              required
              placeholder="Please provide a reason for rejecting this leave request..."
              rows="4"
            ></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="showRejectModal = false">Cancel</button>
            <button type="submit" class="btn btn-danger" :disabled="loading || !rejectReason.trim()">
              Reject Request
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Review Modal (for both approve/reject) -->
    <div v-if="showReviewModal && reviewingRequest" class="modal-overlay" @click.self="showReviewModal = false">
      <div class="modal">
        <h2>Review Leave Request</h2>
        
        <div class="review-details">
          <p><strong>Requester:</strong> {{ getRequesterName(reviewingRequest) }}</p>
          <p><strong>Leave Type:</strong> {{ getLeaveTypeLabel(reviewingRequest.leaveType) }}</p>
          <p><strong>Period:</strong> {{ formatDate(reviewingRequest.startDate) }} - {{ formatDate(reviewingRequest.endDate) }}</p>
          <p><strong>Total Days:</strong> {{ reviewingRequest.totalDays }}</p>
          <p><strong>Reason:</strong> {{ reviewingRequest.reason }}</p>
        </div>

        <form @submit.prevent="submitReview">
          <div class="form-group">
            <label>Decision</label>
            <div class="decision-buttons">
              <button
                type="button"
                class="decision-btn"
                :class="{ active: reviewForm.status === 'approved', approved: reviewForm.status === 'approved' }"
                @click="reviewForm.status = 'approved'"
              >
                ✓ Approve
              </button>
              <button
                type="button"
                class="decision-btn"
                :class="{ active: reviewForm.status === 'rejected', rejected: reviewForm.status === 'rejected' }"
                @click="reviewForm.status = 'rejected'"
              >
                ✗ Reject
              </button>
            </div>
          </div>
          <div class="form-group">
            <label>{{ reviewForm.status === 'rejected' ? 'Rejection Reason *' : 'Note (optional)' }}</label>
            <textarea
              v-model="reviewForm.reviewNote"
              :required="reviewForm.status === 'rejected'"
              placeholder="Add a note..."
              rows="3"
            ></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="showReviewModal = false">Cancel</button>
            <button
              type="submit"
              class="btn"
              :class="reviewForm.status === 'approved' ? 'btn-success' : 'btn-danger'"
              :disabled="loading || (reviewForm.status === 'rejected' && !reviewForm.reviewNote?.trim())"
            >
              {{ reviewForm.status === 'approved' ? 'Approve' : 'Reject' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Stats card specific styles */
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
}

.stat-label {
  color: var(--color-grey);
  font-size: 0.875rem;
}

.stat-success {
  border-left: 4px solid #22c55e;
}

/* Requester info */
.requester-name {
  font-weight: 500;
}

.requester-type {
  color: #888;
  font-size: 0.75rem;
  text-transform: capitalize;
}

/* Type badge */
.type-badge {
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  text-transform: capitalize;
}

.type-badge.student {
  background: #dbeafe;
  color: #1e40af;
}

.type-badge.teacher {
  background: #fef3c7;
  color: #92400e;
}

.period {
  white-space: nowrap;
}

/* Status badges */
.status-badge {
  padding: 0.25rem 0.5rem;
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

/* Actions */
.actions {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
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

.modal-lg {
  min-width: 600px;
  max-width: 800px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.modal-header h2 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--color-grey);
}

.close-btn:hover {
  color: var(--color-dark-grey);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

/* Detail sections */
.detail-section {
  margin-bottom: 1.5rem;
}

.detail-section h3 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  color: var(--color-dark-grey);
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-item label {
  font-size: 0.75rem;
  color: var(--color-grey);
  font-weight: 500;
}

.detail-item span {
  font-size: 0.875rem;
}

.document-link {
  color: var(--color-purple);
  text-decoration: none;
}

.document-link:hover {
  text-decoration: underline;
}

/* Review/Reject info */
.review-details,
.reject-info {
  background: #f9f9f9;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
}

.review-details p,
.reject-info p {
  margin: 0.25rem 0;
  font-size: 0.875rem;
}

/* Form styles */
.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.875rem;
  resize: vertical;
}

/* Decision buttons */
.decision-buttons {
  display: flex;
  gap: 0.5rem;
}

.decision-btn {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.decision-btn:hover {
  background: #f5f5f5;
}

.decision-btn.active.approved {
  border-color: #22c55e;
  background: #dcfce7;
  color: #166534;
}

.decision-btn.active.rejected {
  border-color: var(--color-light-red);
  background: #fee2e2;
  color: #991b1b;
}
</style>
