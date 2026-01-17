<template>
  <div class="leave-management">
    <div class="module-header">
      <h1>Leave Management System</h1>
      <p class="subtitle">Module 6: Leave - RTC Student Management System</p>
    </div>

    <!-- Navigation Tabs -->
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-button', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Leave Request Tab -->
      <div v-if="activeTab === 'request'" class="content-panel">
        <h2>Submit Leave Request</h2>
        <form @submit.prevent="submitLeaveRequest" class="leave-form">
          <div class="form-group">
            <label>Leave Type *</label>
            <select v-model="leaveForm.type" required>
              <option value="">Select leave type</option>
              <option value="sick">Sick Leave</option>
              <option value="annual">Annual Leave</option>
              <option value="personal">Personal Leave</option>
              <option value="emergency">Emergency Leave</option>
              <option value="unpaid">Unpaid Leave</option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Start Date *</label>
              <input type="date" v-model="leaveForm.startDate" required>
            </div>
            <div class="form-group">
              <label>End Date *</label>
              <input type="date" v-model="leaveForm.endDate" required>
            </div>
          </div>

          <div class="form-group">
            <label>Reason *</label>
            <textarea
              v-model="leaveForm.reason"
              rows="4"
              placeholder="Please provide a detailed reason for your leave request"
              required
            ></textarea>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="leaveStore.loading">
              {{ leaveStore.loading ? 'Submitting...' : 'Submit Request' }}
            </button>
            <button type="button" class="btn btn-secondary" @click="resetForm">Clear Form</button>
          </div>
        </form>

        <!-- User's Leave Balance -->
        <div class="leave-balance" v-if="leaveStore.leaveBalance">
          <h3>Your Leave Balance</h3>
          <div class="balance-grid">
            <div class="balance-item">
              <span class="balance-label">Sick Leave</span>
              <span class="balance-value">{{ leaveStore.leaveBalance.sick }} days</span>
            </div>
            <div class="balance-item">
              <span class="balance-label">Annual Leave</span>
              <span class="balance-value">{{ leaveStore.leaveBalance.annual }} days</span>
            </div>
            <div class="balance-item">
              <span class="balance-label">Personal Leave</span>
              <span class="balance-value">{{ leaveStore.leaveBalance.personal }} days</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Leave Approval Tab -->
      <div v-if="activeTab === 'approval'" class="content-panel">
        <h2>Pending Leave Approvals</h2>
        <div class="filters">
          <input
            type="text"
            v-model="approvalFilter"
            placeholder="Search by employee name or ID..."
            class="search-input"
          >
        </div>

        <div class="approval-list">
          <div v-for="request in filteredPendingLeaves" :key="request.id" class="approval-card">
            <div class="card-header">
              <div class="employee-info">
                <div class="avatar">{{ getInitials(request.employeeName) }}</div>
                <div>
                  <h4>{{ request.employeeName }}</h4>
                  <p class="employee-id">ID: {{ request.employeeId }}</p>
                </div>
              </div>
              <span :class="['leave-type-badge', request.type]">{{ request.type }}</span>
            </div>
            <div class="card-body">
              <div class="info-row">
                <span class="label">Duration:</span>
                <span class="value">{{ request.startDate }} to {{ request.endDate }} ({{ request.days }} days)</span>
              </div>
              <div class="info-row">
                <span class="label">Reason:</span>
                <span class="value">{{ request.reason }}</span>
              </div>
            </div>
            <div class="card-actions">
              <button @click="approveLeaveRequest(request.id)" class="btn btn-success" :disabled="leaveStore.loading">
                Approve
              </button>
              <button @click="rejectLeaveRequest(request.id)" class="btn btn-danger" :disabled="leaveStore.loading">
                Reject
              </button>
            </div>
          </div>
        </div>

        <div v-if="filteredPendingLeaves.length === 0" class="empty-state">
          <p>No pending leave requests to review</p>
        </div>
      </div>

      <!-- Leave History Tab -->
      <div v-if="activeTab === 'history'" class="content-panel">
        <h2>Leave History</h2>
        <div class="filters">
          <select v-model="historyStatusFilter">
            <option value="">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div class="history-table-wrapper">
          <table class="history-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Days</th>
                <th>Status</th>
                <th>Reviewed By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in filteredHistoryLeaves" :key="record.id">
                <td><span :class="['type-badge', record.type]">{{ record.type }}</span></td>
                <td>{{ formatDate(record.startDate) }}</td>
                <td>{{ formatDate(record.endDate) }}</td>
                <td>{{ record.days }}</td>
                <td><span :class="['status-badge', record.status]">{{ record.status }}</span></td>
                <td>{{ record.reviewedBy || '-' }}</td>
                <td>
                  <button v-if="record.status === 'pending'" @click="cancelLeaveRequest(record.id)" class="btn-link danger" :disabled="leaveStore.loading">
                    Cancel
                  </button>
                  <span v-else>-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="filteredHistoryLeaves.length === 0" class="empty-state">
          <p>No leave history records found</p>
        </div>
      </div>
    </div>

    <!-- Success/Error Toast -->
    <transition name="fade">
      <div v-if="toast.show" :class="['toast', toast.type]">
        {{ toast.message }}
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useLeaveStore } from '@/stores/leave'

const leaveStore = useLeaveStore()

const activeTab = ref('request')
const tabs = [
  { id: 'request', label: 'Leave Request', icon: '📝' },
  { id: 'approval', label: 'Leave Approval', icon: '✓' },
  { id: 'history', label: 'Leave History', icon: '📊' }
]

const leaveForm = ref({
  type: '',
  startDate: '',
  endDate: '',
  reason: '',
  employeeId: 'EMP001', // Replace with actual logged-in user
  employeeName: 'Current User' // Replace with actual logged-in user
})

const approvalFilter = ref('')
const historyStatusFilter = ref('')

const toast = ref({
  show: false,
  message: '',
  type: 'success'
})

const filteredPendingLeaves = computed(() => {
  if (!approvalFilter.value) return leaveStore.pendingLeaves

  return leaveStore.pendingLeaves.filter(leave =>
    leave.employeeName.toLowerCase().includes(approvalFilter.value.toLowerCase()) ||
    leave.employeeId.toLowerCase().includes(approvalFilter.value.toLowerCase())
  )
})

const filteredHistoryLeaves = computed(() => {
  if (!historyStatusFilter.value) return leaveStore.allLeaves

  return leaveStore.allLeaves.filter(leave => leave.status === historyStatusFilter.value)
})

async function submitLeaveRequest() {
  try {
    await leaveStore.createLeave(leaveForm.value)
    showToast('Leave request submitted successfully!', 'success')
    resetForm()
    await leaveStore.fetchLeaves()
  } catch (error: any) {
    showToast(error.message || 'Failed to submit leave request', 'error')
  }
}

async function approveLeaveRequest(id: string) {
  try {
    await leaveStore.approveLeave(id, 'Manager', 'Approved')
    showToast('Leave request approved successfully!', 'success')
    await leaveStore.fetchLeaves()
  } catch (error: any) {
    showToast(error.message || 'Failed to approve leave', 'error')
  }
}

async function rejectLeaveRequest(id: string) {
  try {
    await leaveStore.rejectLeave(id, 'Manager', 'Rejected')
    showToast('Leave request rejected', 'error')
    await leaveStore.fetchLeaves()
  } catch (error: any) {
    showToast(error.message || 'Failed to reject leave', 'error')
  }
}

async function cancelLeaveRequest(id: string) {
  try {
    await leaveStore.cancelLeave(id)
    showToast('Leave request cancelled', 'info')
    await leaveStore.fetchLeaves()
  } catch (error: any) {
    showToast(error.message || 'Failed to cancel leave', 'error')
  }
}

function resetForm() {
  leaveForm.value = {
    type: '',
    startDate: '',
    endDate: '',
    reason: '',
    employeeId: 'EMP001',
    employeeName: 'Current User'
  }
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString()
}

function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

onMounted(async () => {
  await leaveStore.fetchLeaves()
  await leaveStore.fetchLeaveBalance('EMP001')
})
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.leave-management {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  color: #333;
}

.module-header {
  margin-bottom: 30px;
}

.module-header h1 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 28px;
}

.subtitle {
  margin: 0;
  color: #7f8c8d;
  font-size: 14px;
}

.tabs {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid #e0e0e0;
  margin-bottom: 24px;
}

.tab-button {
  padding: 12px 24px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-size: 16px;
  color: #666;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-button:hover {
  background: #f5f5f5;
  color: #333;
}

.tab-button.active {
  color: #3498db;
  border-bottom-color: #3498db;
  font-weight: 600;
}

.tab-icon {
  font-size: 18px;
}

.content-panel {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.content-panel h2 {
  margin: 0 0 24px 0;
  color: #2c3e50;
  font-size: 22px;
}

.leave-form {
  max-width: 800px;
}

.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #555;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3498db;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

.btn-success {
  background: #27ae60;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #229954;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c0392b;
}

.btn-link {
  background: none;
  border: none;
  color: #3498db;
  cursor: pointer;
  padding: 4px 8px;
  font-size: 13px;
}

.btn-link:hover {
  text-decoration: underline;
}

.btn-link.danger {
  color: #e74c3c;
}

.leave-balance {
  margin-top: 32px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.leave-balance h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #2c3e50;
}

.balance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.balance-item {
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: white;
  border-radius: 6px;
  border-left: 4px solid #3498db;
}

.balance-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.balance-value {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
}

.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 200px;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.filters select {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.approval-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.approval-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  transition: box-shadow 0.3s;
}

.approval-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.employee-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #3498db;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
}

.employee-info h4 {
  margin: 0;
  font-size: 16px;
  color: #2c3e50;
}

.employee-id {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: #999;
}

.leave-type-badge {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.leave-type-badge.sick {
  background: #fee;
  color: #e74c3c;
}

.leave-type-badge.annual {
  background: #e8f5e9;
  color: #27ae60;
}

.leave-type-badge.personal {
  background: #e3f2fd;
  color: #2196f3;
}

.leave-type-badge.emergency {
  background: #fff3e0;
  color: #f57c00;
}

.card-body {
  padding: 16px;
}

.info-row {
  display: flex;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row .label {
  font-weight: 500;
  color: #666;
  min-width: 120px;
}

.info-row .value {
  color: #333;
  flex: 1;
}

.card-actions {
  display: flex;
  gap: 8px;
  padding: 16px;
  background: #f8f9fa;
  border-top: 1px solid #e0e0e0;
}

.history-table-wrapper {
  overflow-x: auto;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.history-table th {
  background: #f8f9fa;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #555;
  border-bottom: 2px solid #e0e0e0;
}

.history-table td {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.history-table tr:hover {
  background: #f8f9fa;
}

.type-badge,
.status-badge {
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.type-badge.sick {
  background: #fee;
  color: #e74c3c;
}

.type-badge.annual {
  background: #e8f5e9;
  color: #27ae60;
}

.status-badge.approved {
  background: #e8f5e9;
  color: #27ae60;
}

.status-badge.rejected {
  background: #fee;
  color: #e74c3c;
}

.status-badge.pending {
  background: #fff3e0;
  color: #f57c00;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}

.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 16px 24px;
  background: #27ae60;
  color: white;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  z-index: 1000;
}

.toast.error {
  background: #e74c3c;
}

.toast.info {
  background: #3498db;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
