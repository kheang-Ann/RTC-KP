<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { attendanceService, type Attendance } from '@/services/attendance'
import { schedulesService, type Schedule } from '@/services/schedules'

const attendances = ref<Attendance[]>([])
const schedules = ref<Schedule[]>([])
const selectedCourse = ref<string | null>(null)
const loading = ref(false)
const error = ref('')

// Get unique courses from schedules
const courses = computed(() => {
  const uniqueCourses = new Map<string, { id: string; code?: string; name: string }>()
  for (const schedule of schedules.value) {
    if (schedule.course && !uniqueCourses.has(schedule.courseId)) {
      uniqueCourses.set(schedule.courseId, {
        id: schedule.courseId,
        code: schedule.course.code,
        name: schedule.course.name,
      })
    }
  }
  return Array.from(uniqueCourses.values())
})

// Calculate stats per course
interface CourseStats {
  courseId: string
  courseName: string
  courseCode?: string
  total: number
  present: number
  late: number
  absent: number
  excused: number
  attendanceRate: number
}

const courseStats = computed((): CourseStats[] => {
  return courses.value.map((course) => {
    const courseAttendances = attendances.value.filter(
      (a) => a.session?.courseId === course.id
    )
    const total = courseAttendances.length
    const present = courseAttendances.filter((a) => a.status === 'present').length
    const late = courseAttendances.filter((a) => a.status === 'late').length
    const absent = courseAttendances.filter((a) => a.status === 'absent').length
    const excused = courseAttendances.filter((a) => a.status === 'excused').length
    const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0

    return {
      courseId: course.id,
      courseName: course.name,
      courseCode: course.code,
      total,
      present,
      late,
      absent,
      excused,
      attendanceRate,
    }
  })
})

// Overall stats
const overallStats = computed(() => {
  const total = attendances.value.length
  const present = attendances.value.filter((a) => a.status === 'present').length
  const late = attendances.value.filter((a) => a.status === 'late').length
  const absent = attendances.value.filter((a) => a.status === 'absent').length
  const excused = attendances.value.filter((a) => a.status === 'excused').length
  const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0

  return { total, present, late, absent, excused, attendanceRate }
})

// Filtered attendances for selected course
const selectedCourseAttendances = computed(() => {
  if (!selectedCourse.value) return []
  return attendances.value.filter((a) => a.session?.courseId === selectedCourse.value)
})

const selectedCourseName = computed(() => {
  if (!selectedCourse.value) return ''
  const course = courses.value.find((c) => c.id === selectedCourse.value)
  return course ? `${course.code || ''} ${course.name}`.trim() : ''
})

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [attendancesData, schedulesData] = await Promise.all([
      attendanceService.getMyAttendance(),
      schedulesService.getMySchedule(1), // Default to semester 1
    ])
    attendances.value = attendancesData
    schedules.value = schedulesData
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function selectCourse(courseId: string) {
  selectedCourse.value = courseId
}

function goBack() {
  selectedCourse.value = null
}

function getStatusClass(status: string) {
  const classes: Record<string, string> = {
    present: 'status-present',
    late: 'status-late',
    absent: 'status-absent',
    excused: 'status-excused',
  }
  return classes[status] || ''
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(dateStr?: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function getAttendanceRateClass(rate: number) {
  if (rate >= 80) return 'rate-good'
  if (rate >= 60) return 'rate-warning'
  return 'rate-danger'
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">My Attendance</h1>
      <p class="page-subtitle">View your attendance history across all courses</p>
    </div>

    <div v-if="error" class="page-alert page-alert-error">{{ error }}</div>

    <div v-if="loading" class="page-loading">Loading...</div>

    <!-- Course Detail View -->
    <template v-else-if="selectedCourse">
      <button class="btn btn-back" @click="goBack">← Back to Courses</button>
      
      <div class="course-detail-header">
        <h2>{{ selectedCourseName }}</h2>
      </div>

      <!-- Course Stats -->
      <div class="page-stats-grid">
        <div class="stat-card border-left-lightblue">
          <div class="stat-value">{{ courseStats.find(c => c.courseId === selectedCourse)?.attendanceRate || 0 }}%</div>
          <div class="stat-label">Attendance Rate</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ courseStats.find(c => c.courseId === selectedCourse)?.total || 0 }}</div>
          <div class="stat-label">Total Sessions</div>
        </div>
        <div class="stat-card stat-success">
          <div class="stat-value">{{ courseStats.find(c => c.courseId === selectedCourse)?.present || 0 }}</div>
          <div class="stat-label">Present</div>
        </div>
        <div class="stat-card border-left-orange">
          <div class="stat-value">{{ courseStats.find(c => c.courseId === selectedCourse)?.late || 0 }}</div>
          <div class="stat-label">Late</div>
        </div>
        <div class="stat-card border-left-lightred">
          <div class="stat-value">{{ courseStats.find(c => c.courseId === selectedCourse)?.absent || 0 }}</div>
          <div class="stat-label">Absent</div>
        </div>
        <div class="stat-card border-left-lightpurple">
          <div class="stat-value">{{ courseStats.find(c => c.courseId === selectedCourse)?.excused || 0 }}</div>
          <div class="stat-label">Excused</div>
        </div>
      </div>

      <!-- Attendance Records Table -->
      <table v-if="selectedCourseAttendances.length" class="page-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Session</th>
            <th>Status</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="attendance in selectedCourseAttendances" :key="attendance.id">
            <td>{{ formatDate(attendance.checkInTime || attendance.session?.startTime) }}</td>
            <td>{{ formatTime(attendance.checkInTime || attendance.session?.startTime) }}</td>
            <td>{{ attendance.session?.title || '-' }}</td>
            <td>
              <span class="status-badge" :class="getStatusClass(attendance.status)">
                {{ attendance.status }}
              </span>
            </td>
            <td>{{ attendance.remarks || '-' }}</td>
          </tr>
        </tbody>
      </table>

      <div v-else class="page-empty">
        <p>No attendance records found for this course.</p>
      </div>
    </template>

    <!-- Courses Overview -->
    <template v-else>
      <!-- Overall Stats -->
      <div class="page-stats-grid">
        <div class="stat-card border-left-lightblue">
          <div class="stat-value">{{ overallStats.attendanceRate }}%</div>
          <div class="stat-label">Overall Attendance</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ courses.length }}</div>
          <div class="stat-label">Total Courses</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ overallStats.total }}</div>
          <div class="stat-label">Total Sessions</div>
        </div>
        <div class="stat-card stat-success">
          <div class="stat-value">{{ overallStats.present }}</div>
          <div class="stat-label">Present</div>
        </div>
        <div class="stat-card border-left-orange">
          <div class="stat-value">{{ overallStats.late }}</div>
          <div class="stat-label">Late</div>
        </div>
        <div class="stat-card border-left-lightred">
          <div class="stat-value">{{ overallStats.absent }}</div>
          <div class="stat-label">Absent</div>
        </div>
      </div>

      <!-- Courses List -->
      <h2 class="section-title">My Courses</h2>
      
      <div v-if="courseStats.length" class="courses-grid">
        <div
          v-for="course in courseStats"
          :key="course.courseId"
          class="course-card"
          @click="selectCourse(course.courseId)"
        >
          <div class="course-header">
            <span class="course-code">{{ course.courseCode || 'N/A' }}</span>
            <span class="attendance-rate" :class="getAttendanceRateClass(course.attendanceRate)">
              {{ course.attendanceRate }}%
            </span>
          </div>
          <h3 class="course-name">{{ course.courseName }}</h3>
          <div class="course-stats">
            <span class="stat-item present">{{ course.present }} Present</span>
            <span class="stat-item late">{{ course.late }} Late</span>
            <span class="stat-item absent">{{ course.absent }} Absent</span>
          </div>
          <div class="course-footer">
            <span class="total-sessions">{{ course.total }} sessions</span>
            <span class="view-details">View Details →</span>
          </div>
        </div>
      </div>

      <div v-else class="page-empty">
        <p>No courses found.</p>
        <router-link to="/student/check-in" class="btn btn-primary">Check In Now</router-link>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* View-specific styles */
.stat-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--color-dark-grey);
}

.stat-label {
  color: var(--color-grey);
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.stat-success {
  border-left: 4px solid #22c55e;
}

.stat-success .stat-value { color: #22c55e; }

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-dark-grey);
  margin: 1.5rem 0 1rem;
}

/* Course Cards */
.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.course-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid #e5e7eb;
}

.course-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.course-code {
  background: #e0e7ff;
  color: #3730a3;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.attendance-rate {
  font-size: 1.25rem;
  font-weight: bold;
}

.rate-good { color: #22c55e; }
.rate-warning { color: #f59e0b; }
.rate-danger { color: #ef4444; }

.course-name {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0.5rem 0;
  line-height: 1.4;
}

.course-stats {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin: 0.75rem 0;
}

.stat-item {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.stat-item.present { background: #d4edda; color: #155724; }
.stat-item.late { background: #fff3cd; color: #856404; }
.stat-item.absent { background: #f8d7da; color: #721c24; }

.course-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
}

.total-sessions {
  font-size: 0.75rem;
  color: #6b7280;
}

.view-details {
  font-size: 0.75rem;
  color: #3b82f6;
  font-weight: 500;
}

/* Back button */
.btn-back {
  background: none;
  border: 1px solid #d1d5db;
  color: #374151;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.btn-back:hover {
  background: #f3f4f6;
}

.course-detail-header {
  margin-bottom: 1.5rem;
}

.course-detail-header h2 {
  font-size: 1.5rem;
  color: #1f2937;
  margin: 0;
}

/* Status badges */
.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: capitalize;
}

.status-present { background: #d4edda; color: #155724; }
.status-late { background: #fff3cd; color: #856404; }
.status-absent { background: #f8d7da; color: #721c24; }
.status-excused { background: #cce5ff; color: #004085; }

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}
</style>
