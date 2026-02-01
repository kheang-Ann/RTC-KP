<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  teachersService,
  type Teacher,
  type CreateTeacherDto,
  type UpdateTeacherDto,
} from '@/services/teachers'
import { departmentsService, type Department } from '@/services/departments'
import { isValidPhoneNumber, isValidOptionalPassword } from '@/utils/validation'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const teachers = ref<Teacher[]>([])
const departments = ref<Department[]>([])
const loading = ref(false)
const error = ref('')
const showModal = ref(false)
const editingTeacher = ref<Teacher | null>(null)
const showDeleteConfirm = ref(false)
const deleteTargetId = ref<number | null>(null)

// Filters
const searchQuery = ref('')
const filterGender = ref<string>('')
const filterDepartment = ref<number | null>(null)

// Filtered teachers
const filteredTeachers = computed(() => {
  let result = teachers.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(t => 
      (t.nameLatin?.toLowerCase() || '').includes(query) || 
      (t.nameKhmer?.toLowerCase() || '').includes(query)
    )
  }
  
  if (filterGender.value) {
    result = result.filter(t => t.gender === filterGender.value)
  }
  
  if (filterDepartment.value) {
    result = result.filter(t => t.departmentId === filterDepartment.value)
  }
  
  return result
})

// Image handling
const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)

// Field-level errors
const fieldErrors = ref<Record<string, string>>({})

// Clear field error when user starts typing
function clearFieldError(field: string) {
  if (fieldErrors.value[field]) {
    delete fieldErrors.value[field]
  }
}

const form = ref({
  nameKhmer: '',
  nameLatin: '',
  gender: 'male' as 'male' | 'female',
  dob: '',
  departmentId: undefined as number | undefined,
  email: '', // Login email (readonly for edit)
  personalEmail: '',
  phoneNumbers: [''] as string[],
  password: '',
})

// Computed for max date (must be at least 18 years old for teacher)
const maxDob = computed(() => {
  const date = new Date()
  date.setFullYear(date.getFullYear() - 18)
  return date.toISOString().split('T')[0]
})

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [teachersData, depsData] = await Promise.all([
      teachersService.getAll(),
      departmentsService.getAll(),
    ])
    teachers.value = teachersData
    departments.value = depsData
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.value = {
    nameKhmer: '',
    nameLatin: '',
    gender: 'male',
    dob: '',
    departmentId: undefined,
    email: '',
    personalEmail: '',
    phoneNumbers: [''],
    password: '',
  }
  imageFile.value = null
  imagePreview.value = null
}

function openCreate() {
  editingTeacher.value = null
  resetForm()
  showModal.value = true
}

function openEdit(teacher: Teacher) {
  editingTeacher.value = teacher
  const dobValue = teacher.dob ? teacher.dob.split('T')[0] : ''
  form.value = {
    nameKhmer: teacher.nameKhmer,
    nameLatin: teacher.nameLatin,
    gender: teacher.gender,
    dob: dobValue || '',
    departmentId: teacher.departmentId,
    email: teacher.user?.email || '',
    personalEmail: teacher.personalEmail,
    phoneNumbers: teacher.phoneNumbers?.length ? [...teacher.phoneNumbers] : [''],
    password: '',
  }
  imageFile.value = null
  imagePreview.value = teacher.image ? `${API_BASE}${teacher.image}` : null
  showModal.value = true
}

function handleImageChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    imageFile.value = target.files[0]
    imagePreview.value = URL.createObjectURL(target.files[0])
  }
}

function removeImage() {
  imageFile.value = null
  imagePreview.value = null
}

// Phone numbers management
function addPhoneNumber() {
  form.value.phoneNumbers.push('')
}

function removePhoneNumber(index: number) {
  if (form.value.phoneNumbers.length > 1) {
    form.value.phoneNumbers.splice(index, 1)
  }
}

// Validate all fields and return true if valid
function validateForm(): boolean {
  fieldErrors.value = {}
  let isValid = true

  // Validate department
  if (!form.value.departmentId) {
    fieldErrors.value.departmentId = 'Department is required'
    isValid = false
  }

  // Validate phone numbers
  const phones = form.value.phoneNumbers.filter((p) => p.trim())
  if (phones.length === 0) {
    fieldErrors.value.phoneNumbers = 'At least one phone number is required'
    isValid = false
  } else {
    for (let i = 0; i < phones.length; i++) {
      const phone = phones[i]
      if (phone) {
        const phoneError = isValidPhoneNumber(phone)
        if (phoneError) {
          fieldErrors.value.phoneNumbers = `Phone #${i + 1}: ${phoneError}`
          isValid = false
          break
        }
      }
    }
  }

  // Validate password
  if (form.value.password) {
    const passwordError = isValidOptionalPassword(form.value.password)
    if (passwordError) {
      fieldErrors.value.password = passwordError
      isValid = false
    }
  }

  return isValid
}

async function saveTeacher() {
  // Run field-level validation
  if (!validateForm()) {
    error.value = 'Please fix the errors below'
    return
  }

  loading.value = true
  error.value = ''
  try {
    // Filter out empty phone numbers
    const phoneNumbers = form.value.phoneNumbers.filter((p) => p.trim())

    if (editingTeacher.value) {
      const updateData: UpdateTeacherDto = {
        nameKhmer: form.value.nameKhmer,
        nameLatin: form.value.nameLatin,
        gender: form.value.gender,
        dob: form.value.dob,
        departmentId: form.value.departmentId,
        personalEmail: form.value.personalEmail,
        phoneNumbers: phoneNumbers,
      }
      if (form.value.password) {
        updateData.password = form.value.password
      }
      await teachersService.update(editingTeacher.value.id, updateData, imageFile.value || undefined)
    } else {
      const createData: CreateTeacherDto = {
        nameKhmer: form.value.nameKhmer,
        nameLatin: form.value.nameLatin,
        gender: form.value.gender,
        dob: form.value.dob,
        departmentId: form.value.departmentId!,
        personalEmail: form.value.personalEmail,
        phoneNumbers: phoneNumbers,
        password: form.value.password,
      }
      await teachersService.create(createData, imageFile.value || undefined)
    }
    showModal.value = false
    await loadData()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function deleteTeacher(id: number) {
  deleteTargetId.value = id
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  if (deleteTargetId.value === null) return
  showDeleteConfirm.value = false
  loading.value = true
  try {
    await teachersService.delete(deleteTargetId.value)
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

function getDepartmentName(departmentId: number | undefined): string {
  if (!departmentId) return '-'
  const dept = departments.value.find((d) => d.id === departmentId)
  return dept?.name || '-'
}
</script>

<template>
  <div class="page-container">
    <div class="page-header-row">
      <h1 class="page-title">👨‍🏫 Teachers Management</h1>
      <button class="btn btn-primary" @click="openCreate">+ Add Teacher</button>
    </div>

    <div v-if="error" class="page-alert page-alert-error">{{ error }}</div>

    <!-- Filters -->
    <div class="page-filters">
      <div class="filter-group">
        <label>Search</label>
        <input v-model="searchQuery" type="text" placeholder="Search by name..." />
      </div>
      <div class="filter-group">
        <label>Gender</label>
        <select v-model="filterGender">
          <option value="">All</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Department</label>
        <select v-model="filterDepartment">
          <option :value="null">All Departments</option>
          <option v-for="dept in departments" :key="dept.id" :value="dept.id">{{ dept.name }}</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="page-loading">Loading...</div>

    <table class="page-table" v-if="filteredTeachers.length">
      <thead>
        <tr>
          <th>Photo</th>
          <th>Name (Khmer)</th>
          <th>Name (Latin)</th>
          <th>Gender</th>
          <th>Department</th>
          <th>Email</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="teacher in filteredTeachers" :key="teacher.id">
          <td>
            <img
              v-if="teacher.image"
              :src="`${API_BASE}${teacher.image}`"
              alt="Photo"
              class="avatar"
            />
            <div v-else class="avatar-placeholder">👤</div>
          </td>
          <td>{{ teacher.nameKhmer }}</td>
          <td>{{ teacher.nameLatin }}</td>
          <td>{{ teacher.gender === 'male' ? '👨 Male' : '👩 Female' }}</td>
          <td>{{ getDepartmentName(teacher.departmentId) }}</td>
          <td>{{ teacher.personalEmail }}</td>
          <td>
            <button class="btn btn-sm btn-secondary" @click="openEdit(teacher)">Edit</button>
            <button class="btn btn-sm btn-danger" @click="deleteTeacher(teacher.id)">
              Delete
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else-if="!loading && teachers.length" class="page-empty">No teachers match your filters.</div>
    <div v-else-if="!loading" class="page-empty">No teachers found.</div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div v-if="error" class="modal-error">{{ error }}</div>
      <div class="modal">
        <h2>{{ editingTeacher ? 'Edit Teacher' : 'Create Teacher' }}</h2>
        <form @submit.prevent="saveTeacher">
          <!-- Image Section -->
          <div class="form-section">
            <h3>📷 Profile Photo</h3>
            <div class="image-upload">
              <div v-if="imagePreview" class="image-preview">
                <img :src="imagePreview" alt="Preview" />
                <button type="button" class="btn btn-sm btn-danger" @click="removeImage">
                  Remove
                </button>
              </div>
              <div v-else class="image-placeholder">
                <span>No image</span>
              </div>
              <input
                type="file"
                accept="image/*"
                @change="handleImageChange"
                id="teacher-image"
                hidden
              />
              <label for="teacher-image" class="btn btn-sm">Choose Image</label>
            </div>
          </div>

          <!-- Personal Information -->
          <div class="form-section">
            <h3>👤 Personal Information</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Name (Khmer) *</label>
                <input
                  v-model="form.nameKhmer"
                  type="text"
                  required
                  placeholder="ឈ្មោះជាភាសាខ្មែរ"
                />
              </div>
              <div class="form-group">
                <label>Name (Latin) *</label>
                <input
                  v-model="form.nameLatin"
                  type="text"
                  required
                  placeholder="Name in Latin"
                />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Gender *</label>
                <select v-model="form.gender" required>
                  <option value="male">👨 Male</option>
                  <option value="female">👩 Female</option>
                </select>
              </div>
              <div class="form-group">
                <label>Date of Birth *</label>
                <input v-model="form.dob" type="date" required :max="maxDob" />
              </div>
            </div>
          </div>

          <!-- Department -->
          <div class="form-section">
            <h3>🏢 Department</h3>
            <div class="form-group">
              <label>Department *</label>
              <select
                v-model.number="form.departmentId"
                required
                :class="{ 'input-error': fieldErrors.departmentId }"
                @change="clearFieldError('departmentId')"
              >
                <option :value="undefined" disabled>Select department</option>
                <option v-for="dept in departments" :key="dept.id" :value="dept.id">
                  {{ dept.name }}
                </option>
              </select>
              <span v-if="fieldErrors.departmentId" class="field-error">
                {{ fieldErrors.departmentId }}
              </span>
            </div>
          </div>

          <!-- Contact Information -->
          <div class="form-section">
            <h3>📞 Contact Information</h3>
            <div class="form-group" v-if="editingTeacher">
              <label>Login Email</label>
              <input
                v-model="form.email"
                type="email"
                disabled
                class="input-disabled"
                placeholder="login@email.com"
              />
              <small class="field-hint">Login email cannot be changed</small>
            </div>
            <div class="form-group">
              <label>Personal Email *</label>
              <input
                v-model="form.personalEmail"
                type="email"
                required
                placeholder="teacher@example.com"
              />
            </div>
            <div class="form-group">
              <label>Phone Numbers</label>
              <div
                v-for="(phone, index) in form.phoneNumbers"
                :key="index"
                class="phone-row"
              >
                <input
                  v-model="form.phoneNumbers[index]"
                  type="tel"
                  placeholder="Phone number"
                  :class="{ 'input-error': fieldErrors.phoneNumbers }"
                  @input="clearFieldError('phoneNumbers')"
                />
                <button
                  v-if="form.phoneNumbers.length > 1"
                  type="button"
                  class="btn btn-sm btn-danger"
                  @click="removePhoneNumber(index)"
                >
                  ✕
                </button>
              </div>
              <span v-if="fieldErrors.phoneNumbers" class="field-error">
                {{ fieldErrors.phoneNumbers }}
              </span>
              <button type="button" class="btn btn-sm" @click="addPhoneNumber">
                + Add Phone
              </button>
            </div>
          </div>

          <!-- Password -->
          <div class="form-section">
            <h3>🔐 Account Password</h3>
            <div class="form-group">
              <label>
                Password {{ editingTeacher ? '(leave empty to keep current)' : '*' }}
              </label>
              <input
                v-model="form.password"
                type="password"
                :required="!editingTeacher"
                placeholder="••••••••"
                :class="{ 'input-error': fieldErrors.password }"
                @input="clearFieldError('password')"
              />
              <span v-if="fieldErrors.password" class="field-error">
                {{ fieldErrors.password }}
              </span>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="showModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ editingTeacher ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <ConfirmDialog
    :show="showDeleteConfirm"
    title="Delete Teacher"
    message="Are you sure you want to delete this teacher? This action cannot be undone."
    @confirm="confirmDelete"
    @cancel="cancelDelete"
  />
</template>

<style scoped>
/* View-specific styles */
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
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
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  overflow-y: auto;
  gap: 12px;
}

.modal-error {
  background: #fee2e2;
  color: #dc2626;
  padding: 12px 20px;
  border-radius: 8px;
  max-width: 600px;
  width: 100%;
  text-align: center;
  font-weight: 500;
}

.modal {
  background: white;
  padding: 24px;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  box-sizing: border-box;
}

.modal * {
  box-sizing: border-box;
}

@media (max-width: 600px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }
}

.modal h2 {
  margin: 0 0 20px 0;
  font-size: 1.25rem;
}

.form-section {
  margin-bottom: 24px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.form-section h3 {
  margin: 0 0 16px 0;
  font-size: 1rem;
  color: #374151;
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

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  font-size: 14px;
  color: #374151;
}

.form-group input[type='text'],
.form-group input[type='email'],
.form-group input[type='password'],
.form-group input[type='tel'],
.form-group input[type='date'],
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.image-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.image-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.image-preview img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #e5e7eb;
}

.image-placeholder {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.phone-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.phone-row input {
  flex: 1;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

/* Field error styles */
.input-error {
  border-color: #dc2626 !important;
  background-color: #fef2f2 !important;
}

.field-error {
  color: #dc2626;
  font-size: 12px;
  margin-top: 4px;
  display: block;
}

.input-disabled {
  background-color: #f3f4f6 !important;
  color: #6b7280 !important;
  cursor: not-allowed;
}

.field-hint {
  display: block;
  color: #6b7280;
  font-size: 0.75rem;
  margin-top: 4px;
  font-style: italic;
}
</style>
