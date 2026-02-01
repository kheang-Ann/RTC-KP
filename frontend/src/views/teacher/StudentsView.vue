<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { schedulesService, type Schedule } from '@/services/schedules'
import { coursesService, type Course } from '@/services/courses'
import { attendanceService, type Attendance } from '@/services/attendance'
import { departmentsService, type Department } from '@/services/departments'
import { programsService, type Program } from '@/services/programs'
import { groupsService, type AvailableStudent } from '@/services/groups'

const students = ref<AvailableStudent[]>([])
const studentGroupMap = ref<Map<number, number[]>>(new Map()) // studentId -> groupIds[]
const courses = ref<Course[]>([])
const schedules = ref<Schedule[]>([])
const departments = ref<Department[]>([])
const programs = ref<Program[]>([])
const loading = ref(false)
const error = ref('')

// Filters
const selectedGender = ref<string>('')
const selectedCourse = ref<string>('')
const searchQuery = ref('')

// Modal state
const showAttendanceModal = ref(false)
const selectedStudent = ref<AvailableStudent | null>(null)
const studentAttendance = ref<Attendance[]>([])

const filteredStudents = computed(() => {
  let result = students.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (s) =>
        (s.nameLatin?.toLowerCase() || '').includes(query) ||
        (s.nameKhmer?.toLowerCase() || '').includes(query),
    )
  }

  if (selectedGender.value) {
    result = result.filter((s) => s.gender === selectedGender.value)
  }

  return result
})



const studentsInCourse = computed(() => {
  let result = filteredStudents.value
  
  // Filter by selected course
  if (selectedCourse.value) {
    // Get group IDs for this course from schedules
    const groupIds = schedules.value
      .filter(s => s.courseId === selectedCourse.value)
      .map(s => s.groupId)
    
    // Filter students who belong to those groups
    result = result.filter(s => groupIds.includes(s.id))
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
    const [coursesData, schedulesData, departmentsData, programsData] = await Promise.all([
      coursesService.getMyCourses(),
      schedulesService.getMyTeachingSchedule(1), // Default to semester 1
      departmentsService.getAll(),
      programsService.getAll(),
    ])
    courses.value = coursesData
    schedules.value = schedulesData
    departments.value = departmentsData
    programs.value = programsData

    // Get unique groups from schedules
    const groupIds = [...new Set(schedulesData.map(s => s.groupId))]
    
    // Fetch students from all groups
    const studentsPromises = groupIds.map(groupId => groupsService.getStudentsInGroup(groupId))
    const studentsArrays = await Promise.all(studentsPromises)
    
    // Build student-to-group mapping and flatten students
    const studentGroupMapping = new Map<number, number[]>()
    const allStudents: AvailableStudent[] = []
    
    studentsArrays.forEach((studentsInGroup, index) => {
      const groupId = groupIds[index]
      if (groupId === undefined) return
      
      studentsInGroup.forEach(student => {
        if (!allStudents.find(s => s.id === student.id)) {
          allStudents.push(student)
        }
        const existingGroups = studentGroupMapping.get(student.id) || []
        if (!existingGroups.includes(groupId)) {
          studentGroupMapping.set(student.id, [...existingGroups, groupId])
        }
      })
    })
    
    students.value = allStudents
    studentGroupMap.value = studentGroupMapping
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function getStudentCourses(studentId: number) {
  // Get the groups this student belongs to
  const studentGroups = studentGroupMap.value.get(studentId) || []
  if (studentGroups.length === 0) return []
  
  // Find schedules for the student's groups and return unique courses
  return schedules.value
    .filter(s => studentGroups.includes(s.groupId))
    .map(s => ({ course: s.course }))
    .filter((item, index, arr) => 
      item.course && arr.findIndex(x => x.course?.id === item.course?.id) === index
    )
}

async function viewAttendance(student: AvailableStudent) {
  selectedStudent.value = student
  loading.value = true
  error.value = ''
  try {
    // Use userId if available, otherwise student id
    const idToUse = student.userId || student.id
    studentAttendance.value = await attendanceService.getByStudent(idToUse)
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
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">Manage Students</h1>
    </div>

    <div v-if="error" class="page-alert page-alert-error">{{ error }}</div>

    <!-- Filters -->
    <div class="page-filters">
      <div class="filter-group">
        <label>Search</label>
        <input v-model="searchQuery" type="text" placeholder="Search by name..." />
      </div>
      <div class="filter-group">
        <label>Filter by Gender</label>
        <select v-model="selectedGender">
          <option value="">All Genders</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
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

    <div v-if="loading" class="page-loading">Loading...</div>

    <!-- Students Table -->
    <table class="page-table" v-if="studentsInCourse.length">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name (Latin)</th>
          <th>Name (Khmer)</th>
          <th>Gender</th>
          <th>Program</th>
          <th>Courses</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="student in studentsInCourse" :key="student.id">
          <td>{{ student.id }}</td>
          <td>{{ student.nameLatin || '-' }}</td>
          <td>{{ student.nameKhmer || '-' }}</td>
          <td>{{ student.gender || '-' }}</td>
          <td>{{ student.program?.name || '-' }}</td>
          <td>
            <div class="courses-list">
              <span
                v-for="item in getStudentCourses(student.id)"
                :key="item.course?.id"
                class="course-badge"
              >
                {{ item.course?.code || 'Unknown' }}
              </span>
              <span v-if="!getStudentCourses(student.id).length" class="no-courses">
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

    <div v-else-if="!loading" class="page-empty">No students found.</div>

    <!-- Attendance Modal -->
    <div v-if="showAttendanceModal" class="modal-overlay" @click.self="showAttendanceModal = false">
      <div class="modal modal-lg">
        <h2>Attendance History</h2>
        <p class="modal-subtitle">
          {{ selectedStudent?.nameLatin || selectedStudent?.nameKhmer || '-' }}
        </p>

        <div v-if="studentAttendance.length" class="attendance-content">
          <table class="page-table">
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
        <div v-else class="page-empty">No attendance records found.</div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showAttendanceModal = false">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* View-specific styles */
.courses-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.course-badge {
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
  color: var(--color-primary);
  padding: 0 2px;
}

.remove-btn:hover {
  color: var(--color-light-red);
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

.modal-lg {
  max-width: 800px;
}

.modal-subtitle {
  color: var(--color-grey);
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
</style>
