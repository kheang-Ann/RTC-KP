<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { leaveRequestsService, type LeaveRequest, type ReviewLeaveRequestDto } from '@/services/leave-requests'
import { coursesService, type Course } from '@/services/courses'

const leaveRequests = ref<LeaveRequest[]>([])
const courses = ref<Course[]>([])
const selectedCourse = ref<string>('')
const selectedStatus = ref<string>('pending')
const loading = ref(false)
const error = ref('')
const successMessage = ref('')
const showReviewModal = ref(false)
const reviewingRequest = ref<LeaveRequest | null>(null)

const reviewForm = ref<ReviewLeaveRequestDto>({
  status: 'approved',
  reviewNote: '',
})

const filteredRequests = computed(() => {
  let result = leaveRequests.value

  if (selectedCourse.value) {
    result = result.filter((r) => r.courseId === selectedCourse.value)
  }

  if (selectedStatus.value) {
    result = result.filter((r) => r.status === selectedStatus.value)
  }

  return result
})

const pendingCount = computed(() => 
  leaveRequests.value.filter((r) => r.status === 'pending').length
)

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [requestsData, coursesData] = await Promise.all([
      leaveRequestsService.getTeacherLeaveRequests(),
      coursesService.getMyCourses(),
    ])
    leaveRequests.value = requestsData
    courses.value = coursesData
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function openReviewModal(request: LeaveRequest) {
  reviewingRequest.value = request
  reviewForm.value = {
    status: 'approved',
    reviewNote: '',
  }
  showReviewModal.value = true
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

async function quickReject(request: LeaveRequest) {
  const note = prompt('Rejection reason (optional):')
  if (note === null) return // User cancelled

  loading.value = true
  error.value = ''
  try {
    await leaveRequestsService.review(request.id, { status: 'rejected', reviewNote: note || undefined })
    successMessage.value = 'Leave request rejected!'
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
      <div>
        <h1>Leave Requests</h1>
        <p class="subtitle" v-if="pendingCount > 0">{{ pendingCount }} pending request(s)</p>
      </div>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

    <!-- Filters -->
    <div class="filters">
      <div class="filter-group">
        <label>Course</label>
        <select v-model="selectedCourse">
          <option value="">All Courses</option>
          <option v-for="course in courses" :key="course.id" :value="course.id">
            {{ course.code || course.name }} - {{ course.name }}
          </option>
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

    <div v-if="loading" class="loading">Loading...</div>

    <template v-else>
      <table v-if="filteredRequests.length" class="table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Course</th>
            <th>Leave Date</th>
            <th>Reason</th>
            <th>Status</th>
            <th>Submitted</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="request in filteredRequests" :key="request.id">
            <td>
              <div class="student-name">{{ request.student?.firstName }} {{ request.student?.lastName }}</div>
              <div class="student-email">{{ request.student?.email }}</div>
            </td>
            <td>{{ request.course?.code || request.course?.name }}</td>
            <td>{{ formatDate(request.leaveDate) }}</td>
            <td class="reason-cell">
              <div class="reason-text">{{ request.reason }}</div>
              <div v-if="request.session" class="session-info">
                Session: {{ request.session.title }}
              </div>
            </td>
            <td>
              <span class="status-badge" :class="getStatusClass(request.status)">{{ request.status }}</span>
            </td>
            <td>{{ formatDateTime(request.createdAt) }}</td>
            <td class="actions">
              <template v-if="request.status === 'pending'">
                <button class="btn btn-sm btn-success" @click="quickApprove(request)">Approve</button>
                <button class="btn btn-sm btn-danger" @click="quickReject(request)">Reject</button>
                <button class="btn btn-sm" @click="openReviewModal(request)">Review</button>
              </template>
              <template v-else>
                <div class="reviewed-info">
                  <span v-if="request.reviewedBy">
                    by {{ request.reviewedBy.firstName }}
                  </span>
                  <span v-if="request.reviewNote" class="review-note" :title="request.reviewNote">
                    📝
                  </span>
                </div>
              </template>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="empty">No leave requests found.</div>
    </template>

    <!-- Review Modal -->
    <div v-if="showReviewModal && reviewingRequest" class="modal-overlay" @click.self="showReviewModal = false">
      <div class="modal">
        <h2>Review Leave Request</h2>
        
        <div class="review-details">
          <p><strong>Student:</strong> {{ reviewingRequest.student?.firstName }} {{ reviewingRequest.student?.lastName }}</p>
          <p><strong>Course:</strong> {{ reviewingRequest.course?.code || reviewingRequest.course?.name }}</p>
          <p><strong>Leave Date:</strong> {{ formatDate(reviewingRequest.leaveDate) }}</p>
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
            <label>Note (optional)</label>
            <textarea v-model="reviewForm.reviewNote" placeholder="Add a note for the student..." rows="3"></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn" @click="showReviewModal = false">Cancel</button>
            <button type="submit" class="btn" :class="reviewForm.status === 'approved' ? 'btn-success' : 'btn-danger'" :disabled="loading">
              {{ reviewForm.status === 'approved' ? 'Approve' : 'Reject' }}
            </button>
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
  margin-bottom: 1.5rem;
}

.header h1 {
  margin: 0;
}

.subtitle {
  color: #f59e0b;
  margin: 0.25rem 0 0 0;
  font-weight: 500;
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.filter-group label {
  font-size: 0.875rem;
  color: #666;
}

.filter-group select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 180px;
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
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.table th {
  background: #f5f5f5;
  font-weight: 600;
  font-size: 0.875rem;
}

.table td {
  font-size: 0.875rem;
}

.student-name {
  font-weight: 500;
}

.student-email {
  color: #888;
  font-size: 0.75rem;
}

.reason-cell {
  max-width: 250px;
}

.reason-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-info {
  color: #888;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

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

.actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.reviewed-info {
  color: #888;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.review-note {
  cursor: help;
}

.btn {
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: background-color 0.2s;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
}

.btn-success {
  background: #22c55e;
  color: white;
}

.btn-success:hover {
  background: #16a34a;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-primary {
  background: #4f46e5;
  color: white;
}

.alert {
  padding: 0.75rem 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.alert-error {
  background: #fee2e2;
  color: #991b1b;
}

.alert-success {
  background: #dcfce7;
  color: #166534;
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
  min-width: 450px;
  max-width: 90%;
}

.modal h2 {
  margin: 0 0 1rem 0;
}

.review-details {
  background: #f9f9f9;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
}

.review-details p {
  margin: 0.25rem 0;
  font-size: 0.875rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

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
  border-color: #ef4444;
  background: #fee2e2;
  color: #991b1b;
}

.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.875rem;
  resize: vertical;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
}
</style>
