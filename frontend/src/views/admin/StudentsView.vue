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

async function saveStudent() {
  // Validation
  if (!form.value.departmentId || !form.value.programId) {
    error.value = 'Please select department and program'
    return
  }

  if (!validateAge(form.value.dob)) {
    error.value = 'Student must be at least 16 years old'
    return
  }

  const phones = form.value.phoneNumbers.filter((p) => p.trim())
  const emergencyPhones = form.value.emergencyPhoneNumbers.filter((p) => p.trim())

  if (phones.length === 0) {
    error.value = 'At least one phone number is required'
    return
  }

  if (emergencyPhones.length === 0) {
    error.value = 'At least one emergency phone number is required'
    return
  }

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
        departmentId: form.value.departmentId,
        programId: form.value.programId,
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

async function deleteStudent(id: number) {
  if (!confirm('Are you sure you want to delete this student?')) return
  loading.value = true
  try {
    await studentsService.delete(id)
    await loadData()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
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
  <div class="container">
    <div class="header">
      <h1>Students Management</h1>
      <button class="btn btn-primary" @click="openCreate">+ Add Student</button>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="loading" class="loading">Loading...</div>

    <table class="table" v-if="students.length">
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
        <tr v-for="student in students" :key="student.id">
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
            <span class="status" :class="getStatusClass(student.academicStatus)">
              {{ student.academicStatus }}
            </span>
          </td>
          <td>
            <button class="btn btn-sm" @click="openEdit(student)">Edit</button>
            <button class="btn btn-sm btn-danger" @click="deleteStudent(student.id)">
              Delete
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else-if="!loading" class="empty">No students found.</div>

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
                <input v-model="form.dob" type="date" required />
              </div>
            </div>
          </div>

          <!-- Academic Information -->
          <div class="form-section">
            <h3>Academic Information</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Department *</label>
                <select v-model.number="form.departmentId" required>
                  <option :value="undefined" disabled>Select Department</option>
                  <option v-for="dept in departments" :key="dept.id" :value="dept.id">
                    {{ dept.name }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Program *</label>
                <select
                  v-model.number="form.programId"
                  required
                  :disabled="!form.departmentId"
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
            <div class="form-group">
              <label>Phone Numbers *</label>
              <div
                v-for="(phone, idx) in form.phoneNumbers"
                :key="'phone-' + idx"
                class="input-row"
              >
                <input
                  v-model="form.phoneNumbers[idx]"
                  type="tel"
                  placeholder="Phone number"
                />
                <button
                  type="button"
                  class="btn btn-sm btn-danger"
                  @click="removePhoneNumber(idx)"
                >
                  -
                </button>
              </div>
              <button type="button" class="btn btn-sm" @click="addPhoneNumber">
                + Add Phone
              </button>
            </div>
            <div class="form-group">
              <label>Emergency Phone Numbers *</label>
              <div
                v-for="(phone, idx) in form.emergencyPhoneNumbers"
                :key="'emergency-' + idx"
                class="input-row"
              >
                <input
                  v-model="form.emergencyPhoneNumbers[idx]"
                  type="tel"
                  placeholder="Emergency phone"
                />
                <button
                  type="button"
                  class="btn btn-sm btn-danger"
                  @click="removeEmergencyPhone(idx)"
                >
                  -
                </button>
              </div>
              <button type="button" class="btn btn-sm" @click="addEmergencyPhone">
                + Add Emergency Phone
              </button>
            </div>
          </div>

          <!-- Password -->
          <div class="form-section">
            <h3>{{ editingStudent ? 'Change Password' : 'Initial Password' }}</h3>
            <div class="form-group">
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
              />
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn" @click="showModal = false">Cancel</button>
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
.container {
  padding: 20px;
  max-width: 1400px;
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
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.table th,
.table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #eee;
  color: #374151;
}

.table th {
  background: #f5f5f5;
  font-weight: 600;
}

.table tr:hover {
  background: #fafafa;
}

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

.btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  background: white;
}

.btn-primary {
  background: var(--color-purple);
  color: white;
  border-color: var(--color-purple);
}

.btn-danger {
  background: var(--color-light-red);
  color: white;
  border-color: var(--color-light-red);
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
}

.modal-large {
  max-width: 700px;
  max-height: 90vh;
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
  color: var(--color-grey);
}
</style>
