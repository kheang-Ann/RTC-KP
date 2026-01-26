<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { departmentsService, type Department, type CreateDepartmentDto } from '@/services/departments'

const departments = ref<Department[]>([])
const loading = ref(false)
const error = ref('')
const showModal = ref(false)

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
  showModal.value = true
}

async function createDepartment() {
  loading.value = true
  error.value = ''
  try {
    await departmentsService.create(form.value)
    showModal.value = false
    await loadData()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

async function deleteDepartment(id: number) {
  if (!confirm('Are you sure you want to delete this department?')) return
  loading.value = true
  try {
    await departmentsService.delete(id)
    await loadData()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="container">
    <div class="header">
      <h1>Departments Management</h1>
      <button class="btn btn-primary" @click="openCreate">+ Add Department</button>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="loading" class="loading">Loading...</div>

    <table class="table" v-if="departments.length">
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

    <div v-else-if="!loading" class="empty">No departments found. Create your first department!</div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <h2>Create Department</h2>
        <form @submit.prevent="createDepartment">
          <div class="form-group">
            <label>Department Name</label>
            <input v-model="form.name" type="text" required placeholder="e.g., Computer Science" />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn" @click="showModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">Create</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.table th {
  background-color: #f5f5f5;
  font-weight: 600;
}

.btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  background: white;
}

.btn-primary {
  background: #4f46e5;
  color: white;
  border-color: #4f46e5;
}

.btn-danger {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
}

.btn-sm {
  padding: 4px 8px;
  margin-right: 4px;
}

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
}

.modal {
  background: white;
  padding: 24px;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
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
}

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 20px;
}

.alert-error {
  padding: 12px;
  background: #fee2e2;
  color: #b91c1c;
  border-radius: 4px;
  margin-bottom: 16px;
}

.loading,
.empty {
  text-align: center;
  padding: 40px;
  color: #666;
}
</style>
