<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { enrollmentsService, type Enrollment } from '@/services/enrollments'

const enrollments = ref<Enrollment[]>([])
const loading = ref(false)
const error = ref('')

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    enrollments.value = await enrollmentsService.getMyEnrollments()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function getStatusClass(status: string) {
  const classes: Record<string, string> = {
    active: 'status-active',
    completed: 'status-completed',
    dropped: 'status-dropped',
  }
  return classes[status] || ''
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
</script>

<template>
  <div class="my-courses">
    <h1>My Courses</h1>
    <p class="subtitle">View your enrolled courses</p>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="loading" class="loading">Loading...</div>

    <div v-else-if="enrollments.length" class="courses-grid">
      <div v-for="enrollment in enrollments" :key="enrollment.id" class="course-card">
        <div class="course-header">
          <span class="course-code">{{ enrollment.course?.code || 'N/A' }}</span>
          <span class="status-badge" :class="getStatusClass(enrollment.status)">
            {{ enrollment.status }}
          </span>
        </div>
        <h3 class="course-name">{{ enrollment.course?.name }}</h3>
        <div class="course-meta">
          <span>Enrolled: {{ formatDate(enrollment.enrolledAt) }}</span>
        </div>
        <div class="course-actions">
          <router-link 
            :to="{ name: 'student-attendance', query: { course: enrollment.courseId } }" 
            class="btn btn-sm"
          >
            View Attendance
          </router-link>
        </div>
      </div>
    </div>

    <div v-else class="empty">
      <p>You are not enrolled in any courses yet.</p>
      <p class="hint">Contact your administrator to get enrolled in courses.</p>
    </div>
  </div>
</template>

<style scoped>
.my-courses {
  padding: 1rem;
}

h1 {
  margin-bottom: 0.25rem;
}

.subtitle {
  color: #666;
  margin-bottom: 1.5rem;
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
  color: #666;
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
  font-size: 0.875rem;
  color: #666;
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
.status-completed { background: #cce5ff; color: #004085; }
.status-dropped { background: #f8d7da; color: #721c24; }

.empty {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.empty p {
  margin-bottom: 0.5rem;
  color: #666;
}

.empty .hint {
  font-size: 0.875rem;
  color: #999;
}

.loading {
  text-align: center;
  padding: 2rem;
}

.alert {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.alert-error {
  background: #f8d7da;
  color: #721c24;
}
</style>
