<template>
  <div class="requests-container">
    <div class="requests-header">
      <h1>📋 Book Requests</h1>
      <p>Request books, documents, or publications</p>
    </div>

    <div class="requests-tabs">
      <button
        :class="['tab-btn', { active: activeTab === 'my-requests' }]"
        @click="activeTab = 'my-requests'"
      >
        My Requests
      </button>
      <button
        v-if="isAdmin"
        :class="['tab-btn', { active: activeTab === 'all-requests' }]"
        @click="activeTab = 'all-requests'"
      >
        All Requests
      </button>
      <button
        :class="['tab-btn', { active: activeTab === 'new-request' }]"
        @click="activeTab = 'new-request'"
      >
        + New Request
      </button>
    </div>

    <!-- New Request Form -->
    <div v-if="activeTab === 'new-request'" class="request-form-section">
      <h2>Submit a New Request</h2>
      <form @submit.prevent="submitRequest">
        <div class="form-group">
          <label for="title">Title of Item *</label>
          <input
            id="title"
            v-model="requestForm.title"
            type="text"
            placeholder="Enter the title of the book or document"
            required
          />
        </div>

        <div class="form-group">
          <label for="author">Author/Publisher</label>
          <input
            id="author"
            v-model="requestForm.author"
            type="text"
            placeholder="Enter author or publisher name"
          />
        </div>

        <div class="form-group">
          <label for="description">Description</label>
          <textarea
            id="description"
            v-model="requestForm.description"
            placeholder="Provide details about the item"
            rows="3"
          ></textarea>
        </div>

        <div class="form-group">
          <label for="justification">Why do you need this? *</label>
          <textarea
            id="justification"
            v-model="requestForm.justification"
            placeholder="Explain why you need this item"
            rows="3"
            required
          ></textarea>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="submitting">
            <span v-if="submitting">⏳ Submitting...</span>
            <span v-else>📤 Submit Request</span>
          </button>
          <button type="button" class="btn btn-secondary" @click="resetRequestForm">
            Clear
          </button>
        </div>

        <div v-if="successMessage" class="message success">
          ✓ {{ successMessage }}
        </div>

        <div v-if="errorMessage" class="message error">
          ✗ {{ errorMessage }}
        </div>
      </form>
    </div>

    <!-- My Requests -->
    <div v-if="activeTab === 'my-requests'" class="requests-list">
      <div v-if="loading" class="loading">
        <p>Loading your requests...</p>
      </div>
      <div v-else-if="myRequests.length === 0" class="no-items">
        <p>You haven't made any requests yet</p>
      </div>
      <div v-else>
        <div
          v-for="request in myRequests"
          :key="request.id"
          class="request-card"
        >
          <div class="request-header">
            <h3>{{ request.title }}</h3>
            <span :class="['status-badge', `status-${request.status}`]">
              {{ formatStatus(request.status) }}
            </span>
          </div>

          <div v-if="request.author" class="request-info">
            <span class="label">Author:</span>
            <span>{{ request.author }}</span>
          </div>

          <div v-if="request.description" class="request-info">
            <span class="label">Description:</span>
            <span>{{ request.description }}</span>
          </div>

          <div class="request-info">
            <span class="label">Reason:</span>
            <span>{{ request.justification }}</span>
          </div>

          <div v-if="request.rejectionReason" class="rejection">
            <strong>Rejection Reason:</strong>
            <p>{{ request.rejectionReason }}</p>
          </div>

          <div class="request-footer">
            <small>{{ formatDate(request.createdAt) }}</small>
            <button
              v-if="request.status === 'pending'"
              @click="deleteRequest(request.id)"
              class="btn btn-small btn-delete"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- All Requests (Admin) -->
    <div v-if="activeTab === 'all-requests'" class="requests-list">
      <div class="filter-controls">
        <select v-model="filterStatus" @change="filterRequests">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="fulfilled">Fulfilled</option>
        </select>
      </div>

      <div v-if="loading" class="loading">
        <p>Loading requests...</p>
      </div>
      <div v-else-if="allRequests.length === 0" class="no-items">
        <p>No requests found</p>
      </div>
      <div v-else>
        <div
          v-for="request in allRequests"
          :key="request.id"
          class="request-card admin"
        >
          <div class="request-header">
            <div>
              <h3>{{ request.title }}</h3>
              <p class="requester">Requested by: {{ request.requester?.firstName }} {{ request.requester?.lastName }}</p>
            </div>
            <span :class="['status-badge', `status-${request.status}`]">
              {{ formatStatus(request.status) }}
            </span>
          </div>

          <div v-if="request.author" class="request-info">
            <span class="label">Author:</span>
            <span>{{ request.author }}</span>
          </div>

          <div v-if="request.description" class="request-info">
            <span class="label">Description:</span>
            <span>{{ request.description }}</span>
          </div>

          <div class="request-info">
            <span class="label">Reason:</span>
            <span>{{ request.justification }}</span>
          </div>

          <div v-if="request.status === 'pending'" class="admin-actions">
            <button
              @click="showApprovalModal(request)"
              class="btn btn-approve"
            >
              ✓ Approve
            </button>
            <button
              @click="showRejectionModal(request)"
              class="btn btn-reject"
            >
              ✗ Reject
            </button>
          </div>

          <div v-else-if="request.approver" class="approval-info">
            <p>
              <strong>{{ request.status === 'approved' ? 'Approved' : 'Rejected' }} by:</strong>
              {{ request.approver?.firstName }} {{ request.approver?.lastName }}
            </p>
            <p v-if="request.approvedAt">
              <strong>Date:</strong> {{ formatDate(request.approvedAt) }}
            </p>
          </div>

          <div class="request-footer">
            <small>{{ formatDate(request.createdAt) }}</small>
          </div>
        </div>
      </div>
    </div>

    <!-- Approval Modal -->
    <div v-if="showModal && modalType === 'approval'" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <button class="close-btn" @click="showModal = false">✕</button>
        <h3>Approve Request</h3>
        <p>Are you sure you want to approve this request?</p>
        <div class="modal-actions">
          <button @click="approveRequest" class="btn btn-approve">
            ✓ Approve
          </button>
          <button @click="showModal = false" class="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Rejection Modal -->
    <div v-if="showModal && modalType === 'rejection'" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <button class="close-btn" @click="showModal = false">✕</button>
        <h3>Reject Request</h3>
        <div class="form-group">
          <label for="rejection-reason">Reason for Rejection</label>
          <textarea
            id="rejection-reason"
            v-model="rejectionReason"
            placeholder="Explain why you're rejecting this request"
            rows="3"
          ></textarea>
        </div>
        <div class="modal-actions">
          <button @click="rejectRequest" class="btn btn-reject">
            ✗ Reject
          </button>
          <button @click="showModal = false" class="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { libraryService } from '@/services/library';

const activeTab = ref('my-requests');
const requestForm = ref({
  title: '',
  author: '',
  description: '',
  justification: '',
});

const myRequests = ref<any[]>([]);
const allRequests = ref<any[]>([]);
const loading = ref(false);
const submitting = ref(false);
const successMessage = ref('');
const errorMessage = ref('');
const showModal = ref(false);
const modalType = ref('');
const selectedRequest = ref<any>(null);
const rejectionReason = ref('');
const filterStatus = ref('');
const isAdmin = ref(false);

// Check if user is admin
const checkAdminStatus = () => {
  const userRole = localStorage.getItem('userRole');
  isAdmin.value = userRole === 'admin';
};

const loadMyRequests = async () => {
  loading.value = true;
  try {
    const response = await libraryService.getAllRequests(undefined, true);
    myRequests.value = response.requests || [];
  } catch (error) {
    console.error('Failed to load requests:', error);
  } finally {
    loading.value = false;
  }
};

const loadAllRequests = async () => {
  loading.value = true;
  try {
    const response = await libraryService.getAllRequests(filterStatus.value || undefined);
    allRequests.value = response.requests || [];
  } catch (error) {
    console.error('Failed to load requests:', error);
  } finally {
    loading.value = false;
  }
};

const filterRequests = () => {
  loadAllRequests();
};

const submitRequest = async () => {
  submitting.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    await libraryService.createRequest(requestForm.value);
    successMessage.value = 'Request submitted successfully!';
    resetRequestForm();
    setTimeout(() => {
      activeTab.value = 'my-requests';
      loadMyRequests();
    }, 1500);
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to submit request';
  } finally {
    submitting.value = false;
  }
};

const deleteRequest = async (id: number) => {
  if (confirm('Are you sure you want to cancel this request?')) {
    try {
      await libraryService.deleteRequest(id);
      loadMyRequests();
    } catch (error) {
      console.error('Failed to delete request:', error);
    }
  }
};

const showApprovalModal = (request: any) => {
  selectedRequest.value = request;
  modalType.value = 'approval';
  showModal.value = true;
};

const showRejectionModal = (request: any) => {
  selectedRequest.value = request;
  modalType.value = 'rejection';
  rejectionReason.value = '';
  showModal.value = true;
};

const approveRequest = async () => {
  try {
    await libraryService.updateRequestStatus(selectedRequest.value.id, {
      status: 'approved',
    });
    showModal.value = false;
    loadAllRequests();
  } catch (error) {
    console.error('Failed to approve request:', error);
  }
};

const rejectRequest = async () => {
  if (!rejectionReason.value.trim()) {
    alert('Please provide a reason for rejection');
    return;
  }

  try {
    await libraryService.updateRequestStatus(selectedRequest.value.id, {
      status: 'rejected',
      rejectionReason: rejectionReason.value,
    });
    showModal.value = false;
    loadAllRequests();
  } catch (error) {
    console.error('Failed to reject request:', error);
  }
};

const resetRequestForm = () => {
  requestForm.value = {
    title: '',
    author: '',
    description: '',
    justification: '',
  };
};

const formatStatus = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString();
};

onMounted(() => {
  checkAdminStatus();
  loadMyRequests();
});
</script>

<style scoped>
.requests-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.requests-header {
  text-align: center;
  margin-bottom: 2rem;
}

.requests-header h1 {
  font-size: 2rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.requests-header p {
  color: #666;
}

.requests-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #eee;
}

.tab-btn {
  padding: 1rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  color: #666;
  transition: all 0.3s;
}

.tab-btn:hover {
  color: #0066cc;
}

.tab-btn.active {
  color: #0066cc;
  border-bottom-color: #0066cc;
}

.request-form-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.request-form-section h2 {
  margin: 0 0 1.5rem 0;
  color: #333;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #0066cc;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background-color 0.3s;
}

.btn-primary {
  background-color: #0066cc;
  color: white;
  flex: 1;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0052a3;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background-color: #e8e8e8;
}

.message {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 6px;
  font-weight: 500;
}

.message.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.requests-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filter-controls {
  margin-bottom: 1rem;
}

.filter-controls select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.request-card {
  background: white;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.request-card.admin {
  border-left: 4px solid #0066cc;
}

.request-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.request-header h3 {
  margin: 0 0 0.25rem 0;
  color: #333;
}

.requester {
  color: #999;
  font-size: 0.9rem;
  margin: 0;
}

.status-badge {
  display: inline-block;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-pending {
  background: #fff3cd;
  color: #856404;
}

.status-approved {
  background: #d4edda;
  color: #155724;
}

.status-rejected {
  background: #f8d7da;
  color: #721c24;
}

.status-fulfilled {
  background: #d1ecf1;
  color: #0c5460;
}

.request-info {
  margin: 0.75rem 0;
  color: #666;
}

.request-info .label {
  display: inline-block;
  font-weight: 600;
  min-width: 100px;
  color: #333;
}

.rejection {
  margin: 1rem 0;
  padding: 1rem;
  background: #fff5f5;
  border-left: 3px solid #dc3545;
  border-radius: 4px;
}

.rejection p {
  margin: 0.5rem 0 0 0;
  color: #721c24;
}

.admin-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn-approve {
  background-color: #28a745;
  color: white;
  flex: 1;
}

.btn-approve:hover {
  background-color: #218838;
}

.btn-reject {
  background-color: #dc3545;
  color: white;
  flex: 1;
}

.btn-reject:hover {
  background-color: #c82333;
}

.btn-small {
  padding: 0.4rem 0.8rem;
  font-size: 0.9rem;
}

.btn-delete {
  background-color: #f8d7da;
  color: #721c24;
}

.btn-delete:hover {
  background-color: #f5c6cb;
}

.approval-info {
  margin-top: 1rem;
  padding: 1rem;
  background: #f0f8ff;
  border-radius: 6px;
  color: #0066cc;
  font-size: 0.9rem;
}

.approval-info p {
  margin: 0.25rem 0;
}

.request-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
  color: #999;
  font-size: 0.9rem;
}

.loading,
.no-items {
  text-align: center;
  padding: 2rem;
  color: #666;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.modal h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.modal p {
  color: #666;
  margin-bottom: 1.5rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
}

.modal-actions .btn {
  flex: 1;
}
</style>
