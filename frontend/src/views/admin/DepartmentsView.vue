<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { departmentsService, type Department, type CreateDepartmentDto } from '@/services/departments'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const departments = ref<Department[]>([])
const loading = ref(false)
const error = ref('')
const showModal = ref(false)
const showDeleteConfirm = ref(false)
const deleteTargetId = ref<number | null>(null)
const modalError = ref('')

const form = ref<CreateDepartmentDto>({
  name: '',
})

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    departments.value = await departmentsService.getAll()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function openCreate() {
  form.value = { name: ''}
  modalError.value = ''
  showModal.value = true
}

async function createDepartment() {
  loading.value = true
  modalError.value = ''
  try {
    await departmentsService.create(form.value)
    showModal.value = false
    await loadData()
  } catch (e) {
    modalError.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function deleteDepartment(id: number) {
  deleteTargetId.value = id
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  if (deleteTargetId.value === null) return
  showDeleteConfirm.value = false
  loading.value = true
  try {
    await departmentsService.delete(deleteTargetId.value)
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
</script>

<template>
  <div class="page-container">
    <div class="page-header-row">
      <h1 class="page-title">Departments Management</h1>
      <button class="btn btn-primary" @click="openCreate">+ Add Department</button>
    </div>

    <div v-if="error" class="page-alert page-alert-error">{{ error }}</div>
    <div v-if="loading" class="page-loading">Loading...</div>

    <table class="page-table" v-if="departments.length">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="dept in departments" :key="dept.id">
          <td>{{ dept.id }}</td>
          <td>{{ dept.name }}</td>
          <td>
            <button class="btn btn-sm btn-danger" @click="deleteDepartment(dept.id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else-if="!loading" class="page-empty">No departments found. Create your first department!</div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <h2>Create Department</h2>
        <div v-if="modalError" class="page-alert page-alert-error">{{ modalError }}</div>
        <form @submit.prevent="createDepartment">
          <div class="form-group">
            <label>Department Name</label>
            <input v-model="form.name" type="text" required placeholder="e.g., Computer Science" />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="showModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">Create</button>
          </div>
        </form>
      </div>
    </div>

    <ConfirmDialog
      :show="showDeleteConfirm"
      title="Delete Department"
      message="Are you sure you want to delete this department? This action cannot be undone."
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>

<style scoped>
/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  overflow-y: auto;
}

.modal {
  background: white;
  padding: 24px;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  box-sizing: border-box;
}

.modal * {
  box-sizing: border-box;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
