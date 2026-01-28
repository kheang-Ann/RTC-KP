function getUserRoleNames(user: User): string[] {
  if (!user.roles) return [];
  return user.roles.map((r: any) => typeof r === 'string' ? r : r.role?.name).filter(Boolean);
}
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usersService, type User, type CreateUserDto } from '@/services/users'
import { departmentsService, type Department } from '@/services/departments'


function getUserRoleNames(user: User): string[] {
  if (!user.roles) return [];
  return user.roles.map((r: any) => typeof r === 'string' ? r : r.role?.name).filter(Boolean);
}

const users = ref<User[]>([])
const departments = ref<Department[]>([])
const loading = ref(false)
const error = ref('')
const showModal = ref(false)
const editingUser = ref<User | null>(null)

const roles = [
  { id: 2, name: 'teacher' },
  { id: 3, name: 'student' },
]

const form = ref({
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  roleId: 3,
  departmentId: undefined as number | undefined,
  isActive: true,
})

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [usersData, depsData] = await Promise.all([usersService.getAll(), departmentsService.getAll()])
    users.value = usersData
    departments.value = depsData
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingUser.value = null
  form.value = {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    roleId: 3,
    departmentId: undefined,
    isActive: true,
  }
  showModal.value = true
}

function openEdit(user: User) {
  editingUser.value = user
  form.value = {
    email: user.email,
    password: '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    roleId: roles.find((r) => getUserRoleNames(user).includes(r.name))?.id || 3,
    departmentId: user.departmentId,
    isActive: user.isActive,
  }
  showModal.value = true
}

async function saveUser() {
  loading.value = true
  error.value = ''
  try {
    if (editingUser.value) {
      const updateData: Record<string, unknown> = {
        firstName: form.value.firstName,
        lastName: form.value.lastName,
        email: form.value.email,
        isActive: form.value.isActive,
        departmentId: form.value.departmentId,
      }
      if (form.value.password) {
        updateData.password = form.value.password
      }
      await usersService.update(editingUser.value.id, updateData)
    } else {
      const createData: CreateUserDto = {
        firstName: form.value.firstName,
        lastName: form.value.lastName,
        email: form.value.email,
        password: form.value.password,
        roleId: form.value.roleId,
        departmentId: form.value.departmentId,
      }
      await usersService.create(createData)
    }
    showModal.value = false
    await loadData()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

async function deleteUser(id: number) {
  if (!confirm('Are you sure you want to delete this user?')) return
  loading.value = true
  try {
    await usersService.delete(id)
    await loadData()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function getRoleBadgeClass(role: string) {
  switch (role) {
    case 'admin':
      return 'badge-admin'
    case 'teacher':
      return 'badge-teacher'
    case 'student':
      return 'badge-student'
    default:
      return ''
  }
}
</script>

<template>
  <div class="container">
    <div class="header">
      <h1>Users Management</h1>
      <button class="btn btn-primary" @click="openCreate">+ Add User</button>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="loading" class="loading">Loading...</div>

    <table class="table" v-if="users.length">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Email</th>
          <th>Roles</th>
          <th>Department</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id">
          <td>{{ user.id }}</td>
          <td>{{ user.firstName }} {{ user.lastName }}</td>
          <td>{{ user.email }}</td>
          <td>
            <span v-for="roleName in getUserRoleNames(user)" :key="roleName" class="badge" :class="getRoleBadgeClass(roleName)">
              {{ roleName }}
            </span>
          </td>
          <td>{{ user.department?.name || '-' }}</td>
          <td>
            <span class="status" :class="user.isActive ? 'status-active' : 'status-inactive'">
              {{ user.isActive ? 'Active' : 'Inactive' }}
            </span>
          </td>
          <td>
            <template v-if="!getUserRoleNames(user).includes('admin')">
              <button class="btn btn-sm" @click="openEdit(user)">Edit</button>
              <button class="btn btn-sm btn-danger" @click="deleteUser(user.id)">Delete</button>
            </template>
            <template v-else>
              <span class="text-muted">Protected</span>
            </template>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else-if="!loading" class="empty">No users found.</div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <h2>{{ editingUser ? 'Edit User' : 'Create User' }}</h2>
        <form @submit.prevent="saveUser">
          <div class="form-row">
            <div class="form-group">
              <label>First Name</label>
              <input v-model="form.firstName" type="text" required placeholder="John" />
            </div>
            <div class="form-group">
              <label>Last Name</label>
              <input v-model="form.lastName" type="text" required placeholder="Doe" />
            </div>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input v-model="form.email" type="email" required placeholder="john@example.com" />
          </div>
          <div class="form-group">
            <label>Password {{ editingUser ? '(leave empty to keep current)' : '' }}</label>
            <input
              v-model="form.password"
              type="password"
              :required="!editingUser"
              placeholder="••••••••"
            />
          </div>
          <div class="form-group" v-if="!editingUser">
            <label>Role</label>
            <select v-model.number="form.roleId" required>
              <option v-for="role in roles" :key="role.id" :value="role.id">{{ role.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Department</label>
            <select v-model.number="form.departmentId">
              <option :value="undefined">No department</option>
              <option v-for="dept in departments" :key="dept.id" :value="dept.id">{{ dept.name }}</option>
            </select>
          </div>
          <div class="form-group" v-if="editingUser">
            <label class="checkbox-label">
              <input v-model="form.isActive" type="checkbox" />
              Active
            </label>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn" @click="showModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ editingUser ? 'Update' : 'Create' }}
            </button>
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
  color: #374151;
}

.table th {
  background-color: #f5f5f5;
  font-weight: 600;
}

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  margin-right: 4px;
}

.badge-admin {
  background: #fef3c7;
  color: #92400e;
}

.badge-teacher {
  background: #dbeafe;
  color: #1e40af;
}

.badge-student {
  background: #d1fae5;
  color: #065f46;
}

.status {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-active {
  background: #d1fae5;
  color: #065f46;
}

.status-inactive {
  background: #fee2e2;
  color: #b91c1c;
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

.form-row {
  display: flex;
  gap: 16px;
}

.form-row .form-group {
  flex: 1;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
}

.form-group input[type='text'],
.form-group input[type='email'],
.form-group input[type='password'],
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-label input {
  width: auto;
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
