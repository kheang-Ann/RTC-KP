<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { enrollmentsService, type Enrollment, type CreateEnrollmentDto } from '@/services/enrollments'
import { coursesService, type Course } from '@/services/courses'
import { usersService, type User, hasRole } from '@/services/users'

const enrollments = ref<Enrollment[]>([])
const courses = ref<Course[]>([])
const students = ref<User[]>([])
const loading = ref(false)
const error = ref('')
const successMessage = ref('')
const showModal = ref(false)
const selectedCourse = ref<string>('')

const form = ref<CreateEnrollmentDto>({
  studentId: 0,
  courseId: '',
})

// Filter enrollments by selected course
const filteredEnrollments = computed(() => {
  if (!selectedCourse.value) return enrollments.value
  return enrollments.value.filter((e) => e.courseId === selectedCourse.value)
})

// Get students not enrolled in the selected course for the modal
const availableStudents = computed(() => {
  if (!form.value.courseId) return students.value
  const enrolledStudentIds = enrollments.value
    .filter((e) => e.courseId === form.value.courseId)
    .map((e) => e.studentId)
  return students.value.filter((s) => !enrolledStudentIds.includes(s.id))
})

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [enrollmentsData, coursesData, usersData] = await Promise.all([
      enrollmentsService.getAll(),
      coursesService.getAll(),
      usersService.getAll(),
    ])
    enrollments.value = enrollmentsData
    courses.value = coursesData
    // Filter only students
    students.value = usersData.filter((u) => hasRole(u, 'student'))
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function openEnrollModal() {
  form.value = {
    studentId: 0,
    courseId: selectedCourse.value || '',
  }
  showModal.value = true
}

async function enrollStudent() {
  if (!form.value.studentId || !form.value.courseId) {
    error.value = 'Please select both a student and a course'
    return
  }

  loading.value = true
  error.value = ''
  try {
    await enrollmentsService.create(form.value)
    successMessage.value = 'Student enrolled successfully!'
    showModal.value = false
    setTimeout(() => (successMessage.value = ''), 3000)
    await loadData()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

async function updateStatus(enrollment: Enrollment, status: 'active' | 'completed' | 'dropped') {
  loading.value = true
  error.value = ''
  try {
    await enrollmentsService.update(enrollment.id, { status })
    successMessage.value = 'Status updated successfully!'
    setTimeout(() => (successMessage.value = ''), 3000)
    await loadData()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

async function removeEnrollment(id: string) {
  if (!confirm('Are you sure you want to remove this enrollment?')) return

  loading.value = true
  error.value = ''
  try {
    await enrollmentsService.delete(id)
    successMessage.value = 'Enrollment removed successfully!'
    setTimeout(() => (successMessage.value = ''), 3000)
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
    case 'completed':
      return 'status-completed'
    case 'dropped':
      return 'status-dropped'
    default:
      return ''
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString()
}
</script>

<template>
  <div class="enrollments-view">
    <div class="header">
      <h1>Course Enrollments</h1>
      <button class="btn btn-primary" @click="openEnrollModal">+ Enroll Student</button>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

    <!-- Filter -->
    <div class="filters">
      <div class="filter-group">
        <label>Filter by Course</label>
        <select v-model="selectedCourse">
          <option value="">All Courses</option>
          <option v-for="course in courses" :key="course.id" :value="course.id">
            {{ course.code || course.name }} - {{ course.name }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading...</div>

    <!-- Enrollments Table -->
    <table class="table" v-if="filteredEnrollments.length">
      <thead>
        <tr>
          <th>Student</th>
          <th>Email</th>
          <th>Course</th>
          <th>Enrolled Date</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="enrollment in filteredEnrollments" :key="enrollment.id">
          <td>{{ enrollment.student?.firstName }} {{ enrollment.student?.lastName }}</td>
          <td>{{ enrollment.student?.email }}</td>
          <td>{{ enrollment.course?.code || enrollment.course?.name }} - {{ enrollment.course?.name }}</td>
          <td>{{ formatDate(enrollment.enrolledAt) }}</td>
          <td>
            <span class="status-badge" :class="getStatusClass(enrollment.status)">
              {{ enrollment.status }}
            </span>
          </td>
          <td class="actions">
            <select
              :value="enrollment.status"
              @change="updateStatus(enrollment, ($event.target as HTMLSelectElement).value as 'active' | 'completed' | 'dropped')"
              class="status-select"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="dropped">Dropped</option>
            </select>
            <button class="btn btn-sm btn-danger" @click="removeEnrollment(enrollment.id)">
              Remove
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else-if="!loading" class="empty">
      No enrollments found. Enroll students in courses!
    </div>

    <!-- Enroll Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <h2>Enroll Student</h2>
        <form @submit.prevent="enrollStudent">
          <div class="form-group">
            <label>Course</label>
            <select v-model="form.courseId" required>
              <option value="" disabled>Select a course</option>
              <option v-for="course in courses" :key="course.id" :value="course.id">
                {{ course.code || course.name }} - {{ course.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Student</label>
            <select v-model="form.studentId" required>
              <option :value="0" disabled>Select a student</option>
              <option v-for="student in availableStudents" :key="student.id" :value="student.id">
                {{ student.firstName }} {{ student.lastName }} ({{ student.email }})
              </option>
            </select>
            <small v-if="form.courseId && availableStudents.length === 0" class="text-muted">
              All students are already enrolled in this course.
            </small>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn" @click="showModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="loading || !form.studentId || !form.courseId">
              Enroll
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.enrollments-view {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h1 {
  margin: 0;
  font-size: 24px;
}

.filters {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-group label {
  font-size: 14px;
  color: #666;
}

.filter-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 200px;
}

.alert {
  padding: 12px 16px;
  border-radius: 4px;
  margin-bottom: 16px;
}

.alert-error {
  background-color: #fee;
  color: #c00;
  border: 1px solid #fcc;
}

.alert-success {
  background-color: #efe;
  color: #060;
  border: 1px solid #cfc;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
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
}

.table th {
  background: #f5f5f5;
  font-weight: 600;
}

.table tr:hover {
  background: #fafafa;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
}

.status-active {
  background: #e3f2fd;
  color: #1976d2;
}

.status-completed {
  background: #e8f5e9;
  color: #388e3c;
}

.status-dropped {
  background: #ffebee;
  color: #d32f2f;
}

.status-select {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
}

.actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.btn-primary {
  background: #4f46e5;
  color: white;
}

.btn-primary:hover {
  background: #4338ca;
}

.btn-primary:disabled {
  background: #a5a5a5;
  cursor: not-allowed;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.empty {
  text-align: center;
  padding: 60px 20px;
  color: #666;
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
  padding: 24px;
  border-radius: 8px;
  min-width: 400px;
  max-width: 90%;
}

.modal h2 {
  margin: 0 0 20px 0;
  font-size: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
}

.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-group small {
  display: block;
  margin-top: 4px;
  font-size: 12px;
}

.text-muted {
  color: #666;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}
</style>
