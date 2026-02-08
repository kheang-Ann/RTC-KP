<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { coursesService, type Course, type CreateCourseDto } from '@/services/courses'
import { departmentsService, type Department } from '@/services/departments'
import { usersService, type User } from '@/services/users'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const courses = ref<Course[]>([])
const departments = ref<Department[]>([])
const teachers = ref<User[]>([])
const loading = ref(false)
const error = ref('')
const modalError = ref('')
const showModal = ref(false)
const editingCourse = ref<Course | null>(null)
const showDeleteConfirm = ref(false)
const deleteTargetId = ref<string | null>(null)

// Filters
const searchQuery = ref('')
const filterDepartment = ref<number | null>(null)
const filterCredits = ref<number | null>(null)

// Get unique credit values for filter
const creditOptions = computed(() => {
  const credits = [...new Set(courses.value.map(c => c.credits))]
  return credits.sort((a, b) => a - b)
})

// Filtered courses
const filteredCourses = computed(() => {
  let result = courses.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(c => 
      c.name.toLowerCase().includes(query) || 
      c.code.toLowerCase().includes(query)
    )
  }
  
  if (filterDepartment.value) {
    result = result.filter(c => c.department?.id === filterDepartment.value)
  }
  
  if (filterCredits.value) {
    result = result.filter(c => c.credits === filterCredits.value)
  }
  
  return result
})

const form = ref<CreateCourseDto>({
  name: '',
  code: '',
  credits: 3,
  departmentId: 0,
  teacherId: undefined,
})

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [coursesData, depsData, teachersData] = await Promise.all([
      coursesService.getAll(),
      departmentsService.getAll(),
      usersService.getTeachers(),
    ])
    courses.value = coursesData
    departments.value = depsData
    teachers.value = teachersData
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingCourse.value = null
  modalError.value = ''
  form.value = { name: '', code: '', credits: 3, departmentId: 0, teacherId: undefined }
  showModal.value = true
}

function openEdit(course: Course) {
  editingCourse.value = course
  modalError.value = ''
  form.value = {
    name: course.name,
    code: course.code,
    credits: course.credits,
    departmentId: course.department?.id,
    teacherId: course.teacher?.id,
  }
  showModal.value = true
}

async function saveCourse() {
  loading.value = true
  modalError.value = ''
  try {
    if (editingCourse.value) {
      await coursesService.update(editingCourse.value.id, form.value)
    } else {
      await coursesService.create(form.value)
    }
    showModal.value = false
    await loadData()
  } catch (e) {
    modalError.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function deleteCourse(id: string) {
  deleteTargetId.value = id
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  if (deleteTargetId.value === null) return
  showDeleteConfirm.value = false
  loading.value = true
  try {
    await coursesService.delete(deleteTargetId.value)
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
      <h1 class="page-title">Courses Management</h1>
      <button class="btn btn-primary" @click="openCreate">+ Add Course</button>
    </div>

    <div v-if="error" class="page-alert page-alert-error">{{ error }}</div>

    <!-- Filters -->
    <div class="page-filters">
      <div class="filter-group">
        <label>Search</label>
        <input v-model="searchQuery" type="text" placeholder="Search by name or code..." />
      </div>
      <div class="filter-group">
        <label>Department</label>
        <select v-model="filterDepartment">
          <option :value="null">All Departments</option>
          <option v-for="dept in departments" :key="dept.id" :value="dept.id">{{ dept.name }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Credits</label>
        <select v-model="filterCredits">
          <option :value="null">All Credits</option>
          <option v-for="credit in creditOptions" :key="credit" :value="credit">{{ credit }}</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="page-loading">Loading...</div>

    <table class="page-table" v-if="filteredCourses.length">
      <thead>
        <tr>
          <th>Code</th>
          <th>Name</th>
          <th>Credits</th>
          <th>Department</th>
          <th>Teacher</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="course in filteredCourses" :key="course.id">
          <td>{{ course.code }}</td>
          <td>{{ course.name }}</td>
          <td>{{ course.credits }}</td>
          <td>{{ course.department?.name || '-' }}</td>
          <td>{{ course.teacher ? (course.teacher.nameLatin || course.teacher.nameKhmer || '-') : '-' }}</td>
          <td>
            <button class="btn btn-sm btn-secondary" @click="openEdit(course)">Edit</button>
            <button class="btn btn-sm btn-danger" @click="deleteCourse(course.id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else-if="!loading && courses.length" class="page-empty">No courses match your filters.</div>
    <div v-else-if="!loading" class="page-empty">No courses found. Create your first course!</div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <h2>{{ editingCourse ? 'Edit Course' : 'Create Course' }}</h2>
        <div v-if="modalError" class="page-alert page-alert-error">{{ modalError }}</div>
        <form @submit.prevent="saveCourse">
          <div class="form-group">
            <label>Course Code</label>
            <input v-model="form.code" type="text" required placeholder="e.g., CS101" />
          </div>
          <div class="form-group">
            <label>Course Name</label>
            <input v-model="form.name" type="text" required placeholder="e.g., Introduction to Programming" />
          </div>
          <div class="form-group">
            <label>Credits</label>
            <input v-model.number="form.credits" type="number" min="1" max="5" required />
          </div>
          <div class="form-group">
            <label>Department</label>
            <select v-model.number="form.departmentId" required>
              <option :value="0" disabled>Select department</option>
              <option v-for="dep in departments" :key="dep.id" :value="dep.id">{{ dep.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Teacher</label>
            <select v-model.number="form.teacherId" required>
              <option :value="undefined" disabled>Select teacher</option>
              <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
                {{ teacher.nameLatin || teacher.nameKhmer || teacher.email }}
              </option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="showModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ editingCourse ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <ConfirmDialog
    :show="showDeleteConfirm"
    title="Delete Course"
    message="Are you sure you want to delete this course? This action cannot be undone."
    @confirm="confirmDelete"
    @cancel="cancelDelete"
  />
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
.form-group select,
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
</style>
