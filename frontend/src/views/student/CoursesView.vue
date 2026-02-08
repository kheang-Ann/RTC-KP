<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { schedulesService, type Schedule } from '@/services/schedules'
import { authService } from '@/services/auth'

const schedules = ref<Schedule[]>([])
const loading = ref(false)
const error = ref('')
const selectedSemester = ref<1 | 2>(1)

const user = computed(() => authService.getUser())

// Extract unique courses from schedules
const courses = computed(() => {
  const courseMap = new Map()
  schedules.value.forEach((schedule) => {
    if (schedule.course && !courseMap.has(schedule.course.id)) {
      courseMap.set(schedule.course.id, schedule.course)
    }
  })
  return Array.from(courseMap.values())
})

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const groupId = user.value?.groupId
    if (!groupId) {
      error.value = 'You are not assigned to a group yet. Please contact your administrator.'
      return
    }
    schedules.value = await schedulesService.getMySchedule(selectedSemester.value)
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

// Watch semester changes
function onSemesterChange() {
  loadData()
}
</script>

<template>
  <div class="page-container">
    <div class="page-header-row">
      <div class="page-header">
        <h1 class="page-title">My Courses</h1>
        <p class="page-subtitle">View your courses from group schedule</p>
      </div>
      <div class="semester-selector">
        <label for="semester">Semester:</label>
        <select id="semester" v-model="selectedSemester" @change="onSemesterChange" class="select">
          <option :value="1">Semester 1</option>
          <option :value="2">Semester 2</option>
        </select>
      </div>
    </div>

    <div v-if="error" class="page-alert page-alert-error">{{ error }}</div>
    <div v-if="loading" class="page-loading">Loading...</div>

    <div v-else-if="courses.length" class="courses-grid">
      <div v-for="course in courses" :key="course.id" class="course-card">
        <div class="course-header">
          <span class="course-code">{{ course.code || 'N/A' }}</span>
          <span class="status-badge status-active">Active</span>
        </div>
        <h3 class="course-name">{{ course.name }}</h3>
        <div class="course-meta">
          <span>Credits: {{ course.credits || 0 }}</span>
          <span v-if="course.teacher">
            Teacher: {{ course.teacher.nameLatin || course.teacher.nameKhmer || '-' }}
          </span>
        </div>
        <div class="course-actions">
          <router-link 
            :to="{ name: 'student-attendance', query: { course: course.id } }" 
            class="btn btn-sm"
          >
            View Attendance
          </router-link>
        </div>
      </div>
    </div>

    <div v-else class="page-empty">
      <p>No courses scheduled for Semester {{ selectedSemester }}.</p>
      <p class="hint">Contact your administrator if this seems incorrect.</p>
    </div>
  </div>
</template>

<style scoped>
/* View-specific styles */
.semester-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.semester-selector label {
  font-weight: 500;
}

.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.course-card {
  background: white;
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.course-code {
  font-size: 0.75rem;
  color: var(--color-grey);
  text-transform: uppercase;
  background: #f0f0f0;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
}

.course-name {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0.5rem 0;
}

.course-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: var(--color-grey);
  margin-bottom: 1rem;
}

.course-actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  background: #007bff;
  color: white;
}

.btn:hover {
  background: #0056b3;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
}

.status-badge {
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: capitalize;
}

.status-active { background: #d4edda; color: #155724; }

.hint {
  font-size: 0.875rem;
  color: #999;
}
</style>
