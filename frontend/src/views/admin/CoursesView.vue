<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { coursesService, type Course, type CreateCourseDto } from '@/services/courses'
import { departmentsService, type Department } from '@/services/departments'
import { usersService, type User } from '@/services/users'

const courses = ref<Course[]>([])
const departments = ref<Department[]>([])
const teachers = ref<User[]>([])
const loading = ref(false)
const error = ref('')
const showModal = ref(false)
const editingCourse = ref<Course | null>(null)

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
  form.value = { name: '', code: '', credits: 3, departmentId: 0, teacherId: undefined }
  showModal.value = true
}

function openEdit(course: Course) {
  editingCourse.value = course
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
  error.value = ''
  try {
    if (editingCourse.value) {
      await coursesService.update(editingCourse.value.id, form.value)
    } else {
      await coursesService.create(form.value)
    }
    showModal.value = false
    await loadData()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

async function deleteCourse(id: string) {
  if (!confirm('Are you sure you want to delete this course?')) return
  loading.value = true
  try {
    await coursesService.delete(id)
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
      <h1>Courses Management</h1>
      <button class="btn btn-primary" @click="openCreate">+ Add Course</button>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="loading" class="loading">Loading...</div>

    <table class="table" v-if="courses.length">
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
        <tr v-for="course in courses" :key="course.id">
          <td>{{ course.code }}</td>
          <td>{{ course.name }}</td>
          <td>{{ course.credits }}</td>
          <td>{{ course.department?.name || '-' }}</td>
          <td>{{ course.teacher ? (course.teacher.nameLatin || course.teacher.nameKhmer || '-') : '-' }}</td>
          <td>
            <button class="btn btn-sm" @click="openEdit(course)">Edit</button>
            <button class="btn btn-sm btn-danger" @click="deleteCourse(course.id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else-if="!loading" class="empty">No courses found. Create your first course!</div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <h2>{{ editingCourse ? 'Edit Course' : 'Create Course' }}</h2>
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
            <input v-model.number="form.credits" type="number" min="1" max="10" required />
          </div>
          <div class="form-group">
            <label>Department</label>
            <select v-model.number="form.departmentId" required>
              <option :value="0" disabled>Select department</option>
              <option v-for="dep in departments" :key="dep.id" :value="dep.id">{{ dep.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Teacher (Optional)</label>
            <select v-model.number="form.teacherId">
              <option :value="undefined">No teacher assigned</option>
              <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
                {{ teacher.nameLatin || teacher.nameKhmer || teacher.email }}
              </option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn" @click="showModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ editingCourse ? 'Update' : 'Create' }}
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
  padding: 60px 20px;
  color: #6b7280;
  background: white;
  border-radius: 8px;
}
</style>
