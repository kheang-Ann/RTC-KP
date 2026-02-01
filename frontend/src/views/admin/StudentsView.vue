<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  studentsService,
  type Student,
  type CreateStudentDto,
  type UpdateStudentDto,
} from '@/services/students'
import { departmentsService, type Department } from '@/services/departments'
import { programsService, type Program } from '@/services/programs'
import { isValidPhoneNumber, isValidOptionalPassword } from '@/utils/validation'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const students = ref<Student[]>([])
const departments = ref<Department[]>([])
const allPrograms = ref<Program[]>([])
const loading = ref(false)
const error = ref('')
const showModal = ref(false)
const editingStudent = ref<Student | null>(null)
const selectedImage = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const showDeleteConfirm = ref(false)
const deleteTargetId = ref<number | null>(null)

// Filters
const searchQuery = ref('')
const filterGender = ref<string>('')
const filterDepartment = ref<number | null>(null)
const filterProgram = ref<number | null>(null)
const filterYear = ref<number | null>(null)

// Filtered programs for filter dropdown (based on selected department)
const filterProgramOptions = computed(() => {
  if (!filterDepartment.value) return allPrograms.value
  return allPrograms.value.filter((p) => p.departmentId === filterDepartment.value)
})

// Get unique years for filter
const yearOptions = computed(() => {
  const years = [...new Set(students.value.map(s => s.academicYear))]
  return years.sort((a, b) => a - b)
})

// Filtered students
const filteredStudents = computed(() => {
  let result = students.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(s => 
      (s.nameLatin?.toLowerCase() || '').includes(query) || 
      (s.nameKhmer?.toLowerCase() || '').includes(query)
    )
  }
  
  if (filterGender.value) {
    result = result.filter(s => s.gender === filterGender.value)
  }
  
  if (filterDepartment.value) {
    result = result.filter(s => s.department?.id === filterDepartment.value)
  }
  
  if (filterProgram.value) {
    result = result.filter(s => s.program?.id === filterProgram.value)
  }
  
  if (filterYear.value) {
    result = result.filter(s => s.academicYear === filterYear.value)
  }
  
  return result
})

// Field-level errors
const fieldErrors = ref<Record<string, string>>({})

// Clear field error when user starts typing
function clearFieldError(field: string) {
  if (fieldErrors.value[field]) {
    delete fieldErrors.value[field]
  }
}

// Programs filtered by selected department
const filteredPrograms = computed(() => {
  if (!form.value.departmentId) return []
  return allPrograms.value.filter((p) => p.departmentId === form.value.departmentId)
})

// Max academic year based on selected program
const maxAcademicYear = computed(() => {
  if (!form.value.programId) return 10
  const program = allPrograms.value.find((p) => p.id === form.value.programId)
  return program?.duration || 10
})

// Computed for max date (must be at least 16 years old for student)
const maxDob = computed(() => {
  const date = new Date()
  date.setFullYear(date.getFullYear() - 16)
  return date.toISOString().split('T')[0]
})

const academicStatuses = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'leave', label: 'Leave' },
  { value: 'graduation', label: 'Graduation' },
] as const

const form = ref({
  // Personal Info
  image: null as File | null,
  nameKhmer: '',
  nameLatin: '',
  gender: 'male' as 'male' | 'female',
  dob: '',
  // Academic Info
  departmentId: undefined as number | undefined,
  programId: undefined as number | undefined,
  academicStatus: 'active' as 'active' | 'suspended' | 'leave' | 'graduation',
  academicYear: 1,
  email: '', // Login email (for edit only)
  // Contact Info
  personalEmail: '',
  phoneNumbers: [''] as string[],
  emergencyPhoneNumbers: [''] as string[],
  // Password
  password: '',
})

// Reset programId when department changes
watch(
  () => form.value.departmentId,
  () => {
    if (!editingStudent.value) {
      form.value.programId = undefined
    }
  },
)

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [studentsData, depsData, programsData] = await Promise.all([
      studentsService.getAll(),
      departmentsService.getAll(),
      programsService.getAll(),
    ])
    students.value = studentsData
    departments.value = depsData
    allPrograms.value = programsData
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingStudent.value = null
  selectedImage.value = null
  imagePreview.value = null
  form.value = {
    image: null,
    nameKhmer: '',
    nameLatin: '',
    gender: 'male',
    dob: '',
    departmentId: undefined,
    programId: undefined,
    academicStatus: 'active',
    academicYear: 1,
    email: '',
    personalEmail: '',
    phoneNumbers: [''],
    emergencyPhoneNumbers: [''],
    password: '',
  }
  showModal.value = true
}

function openEdit(student: Student) {
  editingStudent.value = student
  selectedImage.value = null
  imagePreview.value = student.image ? `${API_BASE}${student.image}` : null
  form.value = {
    image: null,
    nameKhmer: student.nameKhmer,
    nameLatin: student.nameLatin,
    gender: student.gender,
    dob: student.dob?.split('T')[0] || '',
    departmentId: student.departmentId,
    programId: student.programId,
    academicStatus: student.academicStatus,
    academicYear: student.academicYear,
    email: student.user?.email || '',
    personalEmail: student.personalEmail,
    phoneNumbers: student.phoneNumbers.length ? [...student.phoneNumbers] : [''],
    emergencyPhoneNumbers: student.emergencyPhoneNumbers.length
      ? [...student.emergencyPhoneNumbers]
      : [''],
    password: '',
  }
  showModal.value = true
}

function handleImageChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    selectedImage.value = target.files[0]
    imagePreview.value = URL.createObjectURL(target.files[0])
  }
}

function addPhoneNumber() {
  form.value.phoneNumbers.push('')
}

function removePhoneNumber(index: number) {
  if (form.value.phoneNumbers.length > 1) {
    form.value.phoneNumbers.splice(index, 1)
  }
}

function addEmergencyPhone() {
  form.value.emergencyPhoneNumbers.push('')
}

function removeEmergencyPhone(index: number) {
  if (form.value.emergencyPhoneNumbers.length > 1) {
    form.value.emergencyPhoneNumbers.splice(index, 1)
  }
}

function validateAge(dob: string): boolean {
  const birthDate = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age >= 16
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

  // Validate program
  if (!form.value.programId) {
    fieldErrors.value.programId = 'Program is required'
    isValid = false
  }

  // Validate age
  if (form.value.dob && !validateAge(form.value.dob)) {
    fieldErrors.value.dob = 'Student must be at least 16 years old'
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

  // Validate emergency phone numbers
  const emergencyPhones = form.value.emergencyPhoneNumbers.filter((p) => p.trim())
  if (emergencyPhones.length === 0) {
    fieldErrors.value.emergencyPhoneNumbers = 'At least one emergency phone is required'
    isValid = false
  } else {
    for (let i = 0; i < emergencyPhones.length; i++) {
      const phone = emergencyPhones[i]
      if (phone) {
        const phoneError = isValidPhoneNumber(phone)
        if (phoneError) {
          fieldErrors.value.emergencyPhoneNumbers = `Emergency phone #${i + 1}: ${phoneError}`
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

async function saveStudent() {
  // Run field-level validation
  if (!validateForm()) {
    error.value = 'Please fix the errors below'
    return
  }

  const phones = form.value.phoneNumbers.filter((p) => p.trim())
  const emergencyPhones = form.value.emergencyPhoneNumbers.filter((p) => p.trim())

  loading.value = true
  error.value = ''

  try {
    if (editingStudent.value) {
      const updateData: UpdateStudentDto = {
        nameKhmer: form.value.nameKhmer,
        nameLatin: form.value.nameLatin,
        gender: form.value.gender,
        dob: form.value.dob,
        departmentId: form.value.departmentId,
        programId: form.value.programId,
        academicStatus: form.value.academicStatus,
        academicYear: form.value.academicYear,
        email: form.value.email,
        personalEmail: form.value.personalEmail,
        phoneNumbers: phones,
        emergencyPhoneNumbers: emergencyPhones,
      }
      if (form.value.password) {
        updateData.password = form.value.password
      }
      await studentsService.update(
        editingStudent.value.id,
        updateData,
        selectedImage.value || undefined,
      )
    } else {
      const createData: CreateStudentDto = {
        nameKhmer: form.value.nameKhmer,
        nameLatin: form.value.nameLatin,
        gender: form.value.gender,
        dob: form.value.dob,
        departmentId: form.value.departmentId!,
        programId: form.value.programId!,
        personalEmail: form.value.personalEmail,
        phoneNumbers: phones,
        emergencyPhoneNumbers: emergencyPhones,
        password: form.value.password || undefined,
      }
      await studentsService.create(createData, selectedImage.value || undefined)
    }
    showModal.value = false
    await loadData()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function deleteStudent(id: number) {
  deleteTargetId.value = id
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  if (deleteTargetId.value === null) return
  showDeleteConfirm.value = false
  loading.value = true
  try {
    await studentsService.delete(deleteTargetId.value)
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

function getStatusClass(status: string) {
  switch (status) {
    case 'active':
      return 'status-active'
    case 'suspended':
      return 'status-suspended'
    case 'leave':
      return 'status-leave'
    case 'graduation':
      return 'status-graduation'
    default:
      return ''
  }
}
</script>

<template>
  <div class="page-container">
    <div class="page-header-row">
      <h1 class="page-title">Students Management</h1>
      <button class="btn btn-primary" @click="openCreate">+ Add Student</button>
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
      <div class="filter-group">
        <label>Program</label>
        <select v-model="filterProgram" :disabled="!filterDepartment">
          <option :value="null">All Programs</option>
          <option v-for="program in filterProgramOptions" :key="program.id" :value="program.id">{{ program.name }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Year</label>
        <select v-model="filterYear">
          <option :value="null">All Years</option>
          <option v-for="year in yearOptions" :key="year" :value="year">Year {{ year }}</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="page-loading">Loading...</div>

    <table class="page-table" v-if="filteredStudents.length">
      <thead>
        <tr>
          <th>ID</th>
          <th>Photo</th>
          <th>Name (Latin)</th>
          <th>Name (Khmer)</th>
          <th>Gender</th>
          <th>Department</th>
          <th>Program</th>
          <th>Year</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="student in filteredStudents" :key="student.id">
          <td>{{ student.id }}</td>
          <td>
            <img
              v-if="student.image"
              :src="`${API_BASE}${student.image}`"
              class="avatar"
              alt="Photo"
            />
            <div v-else class="avatar-placeholder">
              {{ student.nameLatin.charAt(0) }}
            </div>
          </td>
          <td>{{ student.nameLatin }}</td>
          <td>{{ student.nameKhmer }}</td>
          <td>{{ student.gender === 'male' ? 'Male' : 'Female' }}</td>
          <td>{{ student.department?.name || '-' }}</td>
          <td>{{ student.program?.name || '-' }}</td>
          <td>{{ student.academicYear }}</td>
          <td>
            <span class="status-badge" :class="getStatusClass(student.academicStatus)">
              {{ student.academicStatus }}
            </span>
          </td>
          <td>
            <button class="btn btn-sm btn-secondary" @click="openEdit(student)">Edit</button>
            <button class="btn btn-sm btn-danger" @click="deleteStudent(student.id)">
              Delete
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else-if="!loading && students.length" class="page-empty">No students match your filters.</div>
    <div v-else-if="!loading" class="page-empty">No students found.</div>

    <ConfirmDialog
      :show="showDeleteConfirm"
      title="Delete Student"
      message="Are you sure you want to delete this student? This action cannot be undone."
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal modal-large">
        <h2>{{ editingStudent ? 'Edit Student' : 'Create Student' }}</h2>
        <form @submit.prevent="saveStudent">
          <!-- Image Upload -->
          <div class="form-section">
            <h3>Profile Photo</h3>
            <div class="image-upload">
              <div class="image-preview">
                <img v-if="imagePreview" :src="imagePreview" alt="Preview" />
                <div v-else class="placeholder">No Image</div>
              </div>
              <input type="file" accept="image/*" @change="handleImageChange" />
            </div>
          </div>

          <!-- Personal Information -->
          <div class="form-section">
            <h3>Personal Information</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Name in Khmer *</label>
                <input
                  v-model="form.nameKhmer"
                  type="text"
                  required
                  placeholder="ឈ្មោះជាភាសាខ្មែរ"
                />
              </div>
              <div class="form-group">
                <label>Name in Latin *</label>
                <input
                  v-model="form.nameLatin"
                  type="text"
                  required
                  placeholder="Name in English"
                />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Gender *</label>
                <select v-model="form.gender" required>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div class="form-group">
                <label>Date of Birth * (must be 16+)</label>
                <input
                  v-model="form.dob"
                  type="date"
                  required
                  :max="maxDob"
                  :class="{ 'input-error': fieldErrors.dob }"
                  @input="clearFieldError('dob')"
                />
                <span v-if="fieldErrors.dob" class="field-error">{{ fieldErrors.dob }}</span>
              </div>
            </div>
          </div>

          <!-- Academic Information -->
          <div class="form-section">
            <h3>Academic Information</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Department *</label>
                <select
                  v-model.number="form.departmentId"
                  required
                  :class="{ 'input-error': fieldErrors.departmentId }"
                  @change="clearFieldError('departmentId')"
                >
                  <option :value="undefined" disabled>Select Department</option>
                  <option v-for="dept in departments" :key="dept.id" :value="dept.id">
                    {{ dept.name }}
                  </option>
                </select>
                <span v-if="fieldErrors.departmentId" class="field-error">{{ fieldErrors.departmentId }}</span>
              </div>
              <div class="form-group">
                <label>Program *</label>
                <select
                  v-model.number="form.programId"
                  required
                  :disabled="!form.departmentId"
                  :class="{ 'input-error': fieldErrors.programId }"
                  @change="clearFieldError('programId')"
                >
                  <option :value="undefined" disabled>Select Program</option>
                  <option
                    v-for="prog in filteredPrograms"
                    :key="prog.id"
                    :value="prog.id"
                  >
                    {{ prog.name }} ({{ prog.duration }} years)
                  </option>
                </select>
                <span v-if="fieldErrors.programId" class="field-error">{{ fieldErrors.programId }}</span>
              </div>
            </div>
            <div class="form-row" v-if="editingStudent">
              <div class="form-group">
                <label>Academic Status *</label>
                <select v-model="form.academicStatus" required>
                  <option
                    v-for="status in academicStatuses"
                    :key="status.value"
                    :value="status.value"
                  >
                    {{ status.label }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Academic Year (1-{{ maxAcademicYear }}) *</label>
                <input
                  v-model.number="form.academicYear"
                  type="number"
                  :min="1"
                  :max="maxAcademicYear"
                  required
                  :disabled="form.academicStatus === 'graduation'"
                />
              </div>
            </div>
            <div class="form-group" v-if="editingStudent">
              <label>Login Email *</label>
              <input
                v-model="form.email"
                type="email"
                required
                placeholder="login@email.com"
              />
            </div>
          </div>

          <!-- Contact Information -->
          <div class="form-section">
            <h3>Contact Information</h3>
            <div class="form-group">
              <label>Personal Email *</label>
              <input
                v-model="form.personalEmail"
                type="email"
                required
                placeholder="personal@email.com"
              />
            </div>
            <div class="form-group" :class="{ 'has-error': fieldErrors.phoneNumbers }">
              <label>Phone Numbers *</label>
              <div
                v-for="(phone, idx) in form.phoneNumbers"
                :key="'phone-' + idx"
                class="input-row"
              >
                <input
                  v-model="form.phoneNumbers[idx]"
                  type="tel"
                  placeholder="0XX XXX XXXX"
                  :class="{ 'input-error': fieldErrors.phoneNumbers }"
                  @input="clearFieldError('phoneNumbers')"
                />
                <button
                  type="button"
                  class="btn btn-sm btn-danger"
                  @click="removePhoneNumber(idx)"
                >
                  -
                </button>
              </div>
              <span v-if="fieldErrors.phoneNumbers" class="field-error">{{ fieldErrors.phoneNumbers }}</span>
              <button type="button" class="btn btn-sm" @click="addPhoneNumber">
                + Add Phone
              </button>
            </div>
            <div class="form-group" :class="{ 'has-error': fieldErrors.emergencyPhoneNumbers }">
              <label>Emergency Phone Numbers *</label>
              <div
                v-for="(phone, idx) in form.emergencyPhoneNumbers"
                :key="'emergency-' + idx"
                class="input-row"
              >
                <input
                  v-model="form.emergencyPhoneNumbers[idx]"
                  type="tel"
                  placeholder="0XX XXX XXXX"
                  :class="{ 'input-error': fieldErrors.emergencyPhoneNumbers }"
                  @input="clearFieldError('emergencyPhoneNumbers')"
                />
                <button
                  type="button"
                  class="btn btn-sm btn-danger"
                  @click="removeEmergencyPhone(idx)"
                >
                  -
                </button>
              </div>
              <span v-if="fieldErrors.emergencyPhoneNumbers" class="field-error">{{ fieldErrors.emergencyPhoneNumbers }}</span>
              <button type="button" class="btn btn-sm" @click="addEmergencyPhone">
                + Add Emergency Phone
              </button>
            </div>
          </div>

          <!-- Password -->
          <div class="form-section">
            <h3>{{ editingStudent ? 'Change Password' : 'Initial Password' }}</h3>
            <div class="form-group" :class="{ 'has-error': fieldErrors.password }">
              <label>
                Password
                {{
                  editingStudent
                    ? '(leave empty to keep current)'
                    : '(default: student123)'
                }}
              </label>
              <input
                v-model="form.password"
                type="password"
                :required="false"
                placeholder="••••••••"
                :class="{ 'input-error': fieldErrors.password }"
                @input="clearFieldError('password')"
              />
              <span v-if="fieldErrors.password" class="field-error">{{ fieldErrors.password }}</span>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="showModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ editingStudent ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
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
  font-weight: 600;
  color: #6b7280;
}

.status {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  text-transform: capitalize;
}

.status-active {
  background: #d1fae5;
  color: #065f46;
}

.status-suspended {
  background: #fee2e2;
  color: #b91c1c;
}

.status-leave {
  background: #fef3c7;
  color: #92400e;
}

.status-graduation {
  background: #dbeafe;
  color: #1e40af;
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
  align-items: center;
  justify-content: center;
  z-index: 1000;
  overflow-y: auto;
  padding: 20px;
}

.modal {
  background: white;
  padding: 24px;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  box-sizing: border-box;
}

.modal * {
  box-sizing: border-box;
}

.modal-large {
  max-width: 700px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
}

.form-section {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.form-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
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

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: #374151;
}

.form-group input[type='text'],
.form-group input[type='email'],
.form-group input[type='tel'],
.form-group input[type='password'],
.form-group input[type='date'],
.form-group input[type='number'],
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.input-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.input-row input {
  flex: 1;
}

.image-upload {
  display: flex;
  align-items: center;
  gap: 16px;
}

.image-preview {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-preview .placeholder {
  color: #9ca3af;
  font-size: 12px;
}

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 20px;
}

/* Field-level error styles */
.input-error,
.form-group input.input-error,
.form-group select.input-error {
  border-color: #dc3545 !important;
  background-color: #fff5f5;
}

.input-error:focus {
  box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.25);
  outline: none;
}

.field-error {
  display: block;
  color: #dc3545;
  font-size: 0.8rem;
  margin-top: 4px;
}

.form-group.has-error label {
  color: #dc3545;
}
</style>
