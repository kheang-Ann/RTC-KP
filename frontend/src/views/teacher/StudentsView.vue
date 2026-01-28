<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { usersService, type User } from '@/services/users'
import { enrollmentsService, type Enrollment } from '@/services/enrollments'
import { coursesService, type Course } from '@/services/courses'
import { attendanceService, type Attendance } from '@/services/attendance'

const students = ref<User[]>([])
const courses = ref<Course[]>([])
const enrollments = ref<Enrollment[]>([])
const loading = ref(false)
const error = ref('')

// Filters
const selectedCourse = ref<string>('')
const searchQuery = ref('')

// Modal state
const showAttendanceModal = ref(false)
const selectedStudent = ref<User | null>(null)
const studentAttendance = ref<Attendance[]>([])

const filteredStudents = computed(() => {
  let result = students.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (s) =>
        s.firstName.toLowerCase().includes(query) ||
        s.lastName.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query),
    )
  }

  return result
})

const studentsInCourse = computed(() => {
  // Get IDs of all courses the teacher manages
  const teacherCourseIds = courses.value.map((c) => c.id)
  
  // Get IDs of students enrolled in teacher's courses
  const enrolledInTeacherCourses = enrollments.value
    .filter((e) => teacherCourseIds.includes(e.courseId))
    .map((e) => e.studentId)
  
  // Base filter: only students in teacher's courses
  let result = filteredStudents.value.filter((s) => enrolledInTeacherCourses.includes(s.id))
  
  // Additional filter by selected course
  if (selectedCourse.value) {
    const enrolledIds = enrollments.value
      .filter((e) => e.courseId === selectedCourse.value)
      .map((e) => e.studentId)
    result = result.filter((s) => enrolledIds.includes(s.id))
  }
  
  return result
})

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [studentsData, coursesData, enrollmentsData] = await Promise.all([
      usersService.getStudents(),
      coursesService.getMyCourses(),
      enrollmentsService.getAll(),
    ])
    students.value = studentsData
    courses.value = coursesData
    enrollments.value = enrollmentsData
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function getStudentEnrollments(studentId: number) {
  // Only show enrollments in teacher's courses
  const teacherCourseIds = courses.value.map((c) => c.id)
  return enrollments.value.filter(
    (e) => e.studentId === studentId && teacherCourseIds.includes(e.courseId),
  )
}

async function viewAttendance(student: User) {
  selectedStudent.value = student
  loading.value = true
  error.value = ''
  try {
    studentAttendance.value = await attendanceService.getByStudent(student.id)
    showAttendanceModal.value = true
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function getStatusClass(status: string) {
  const classes: Record<string, string> = {
    present: 'status-present',
    absent: 'status-absent',
    late: 'status-late',
    excused: 'status-excused',
  }
  return classes[status] || ''
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString()
}
</script>

<template>
  <div class="container">
    <div class="header">
      <h1>Manage Students</h1>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>

    <!-- Filters -->
    <div class="filters">
      <div class="filter-group">
        <label>Search</label>
        <input v-model="searchQuery" type="text" placeholder="Search by name or email..." />
      </div>
      <div class="filter-group">
        <label>Filter by Course</label>
        <select v-model="selectedCourse">
          <option value="">All Students</option>
          <option v-for="course in courses" :key="course.id" :value="course.id">
            {{ course.code }} - {{ course.name }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading...</div>

    <!-- Students Table -->
    <table class="table" v-if="studentsInCourse.length">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Email</th>
          <th>Department</th>
          <th>Enrolled Courses</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="student in studentsInCourse" :key="student.id">
          <td>{{ student.id }}</td>
          <td>{{ student.firstName }} {{ student.lastName }}</td>
          <td>{{ student.email }}</td>
          <td>{{ student.department?.name || '-' }}</td>
          <td>
            <div class="enrollments-list">
              <span
                v-for="enrollment in getStudentEnrollments(student.id)"
                :key="enrollment.id"
                class="enrollment-badge"
              >
                {{ enrollment.course?.code || 'Unknown' }}
              </span>
              <span v-if="!getStudentEnrollments(student.id).length" class="no-courses">
                No courses
              </span>
            </div>
          </td>
          <td>
            <button class="btn btn-sm btn-secondary" @click="viewAttendance(student)">
              Attendance
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else-if="!loading" class="empty">No students found.</div>

    <!-- Attendance Modal -->
    <div v-if="showAttendanceModal" class="modal-overlay" @click.self="showAttendanceModal = false">
      <div class="modal modal-lg">
        <h2>Attendance History</h2>
        <p class="modal-subtitle">
          {{ selectedStudent?.firstName }} {{ selectedStudent?.lastName }}
        </p>

        <div v-if="studentAttendance.length" class="attendance-content">
          <table class="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Course</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="att in studentAttendance" :key="att.id">
                <td>{{ formatDate(att.checkInTime || '') }}</td>
                <td>{{ att.session?.courseId || '-' }}</td>
                <td>
                  <span class="status-badge" :class="getStatusClass(att.status)">
                    {{ att.status }}
                  </span>
                </td>
                <td>{{ att.remarks || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty">No attendance records found.</div>

        <div class="modal-actions">
          <button class="btn" @click="showAttendanceModal = false">Close</button>
        </div>
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
  margin-bottom: 20px;
}

.filters {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-group label {
  font-weight: 500;
  font-size: 14px;
}

.filter-group input,
.filter-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 200px;
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

.enrollments-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.enrollment-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: #e0e7ff;
  color: #3730a3;
  border-radius: 12px;
  font-size: 12px;
}

.remove-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: #6366f1;
  padding: 0 2px;
}

.remove-btn:hover {
  color: #ef4444;
}

.no-courses {
  color: #999;
  font-size: 12px;
}

.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  text-transform: capitalize;
}

.status-present {
  background: #d1fae5;
  color: #065f46;
}

.status-absent {
  background: #fee2e2;
  color: #b91c1c;
}

.status-late {
  background: #fef3c7;
  color: #92400e;
}

.status-excused {
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
  background: #4f46e5;
  color: white;
  border-color: #4f46e5;
}

.btn-secondary {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.btn-sm {
  padding: 4px 12px;
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
}

.modal {
  background: white;
  padding: 24px;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-lg {
  max-width: 800px;
}

.modal-subtitle {
  color: #666;
  margin-bottom: 16px;
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

.attendance-content {
  max-height: 400px;
  overflow-y: auto;
}

.alert-error {
  padding: 12px;
  background: #fee2e2;
  color: #b91c1c;
  border-radius: 4px;
  margin-bottom: 16px;
}

.alert-success {
  padding: 12px;
  background: #d1fae5;
  color: #065f46;
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
