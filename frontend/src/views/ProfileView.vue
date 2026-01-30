<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { authService } from '@/services/auth'
import { studentsService, type Student } from '@/services/students'
import { teachersService, type Teacher } from '@/services/teachers'

const user = computed(() => authService.getUser())
const loading = ref(false)
const error = ref('')

// Profile data based on user type
const studentProfile = ref<Student | null>(null)
const teacherProfile = ref<Teacher | null>(null)

const isStudent = computed(() => user.value?.roles.includes('student'))
const isTeacher = computed(() => user.value?.roles.includes('teacher'))
const isAdmin = computed(() => user.value?.roles.includes('admin'))

const profileImage = computed(() => {
  if (studentProfile.value?.image) {
    return `http://localhost:3000${studentProfile.value.image}`
  }
  if (teacherProfile.value?.image) {
    return `http://localhost:3000${teacherProfile.value.image}`
  }
  return null
})

const displayName = computed(() => {
  if (studentProfile.value) {
    return studentProfile.value.nameLatin || studentProfile.value.nameKhmer
  }
  if (teacherProfile.value) {
    return teacherProfile.value.nameLatin || teacherProfile.value.nameKhmer
  }
  return user.value?.nameLatin || user.value?.nameKhmer || user.value?.email
})

const userInitial = computed(() => {
  const name = displayName.value || ''
  return name.charAt(0).toUpperCase() || 'U'
})

onMounted(async () => {
  await loadProfile()
})

async function loadProfile() {
  loading.value = true
  error.value = ''
  try {
    // Load detailed profile based on user role using /me endpoints
    if (isStudent.value) {
      studentProfile.value = await studentsService.getMyProfile()
    } else if (isTeacher.value) {
      teacherProfile.value = await teachersService.getMyProfile()
    }
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}
</script>

<template>
  <div class="profile-page">
    <h1>👤 My Profile</h1>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="loading" class="loading">Loading profile...</div>

    <template v-else>
      <!-- Profile Card -->
      <div class="profile-card">
        <div class="profile-header">
          <div class="profile-avatar">
            <img v-if="profileImage" :src="profileImage" alt="Profile" class="avatar-img" />
            <div v-else class="avatar-placeholder">{{ userInitial }}</div>
          </div>
          <div class="profile-info">
            <h2>{{ displayName }}</h2>
            <span class="role-badge" :class="{ admin: isAdmin, teacher: isTeacher, student: isStudent }">
              {{ isAdmin ? '👑 Admin' : isTeacher ? '👨‍🏫 Teacher' : '🎓 Student' }}
            </span>
          </div>
        </div>

        <!-- Account Information -->
        <div class="info-section">
          <h3>📧 Account Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>Email</label>
              <span>{{ user?.email }}</span>
            </div>
            <div class="info-item">
              <label>User ID</label>
              <span>#{{ user?.id }}</span>
            </div>
          </div>
        </div>

        <!-- Student Profile Details -->
        <template v-if="isStudent && studentProfile">
          <div class="info-section">
            <h3>👤 Personal Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <label>Name (Khmer)</label>
                <span>{{ studentProfile.nameKhmer }}</span>
              </div>
              <div class="info-item">
                <label>Name (Latin)</label>
                <span>{{ studentProfile.nameLatin }}</span>
              </div>
              <div class="info-item">
                <label>Gender</label>
                <span>{{ studentProfile.gender === 'male' ? '👨 Male' : '👩 Female' }}</span>
              </div>
              <div class="info-item">
                <label>Date of Birth</label>
                <span>{{ formatDate(studentProfile.dob) }}</span>
              </div>
            </div>
          </div>

          <div class="info-section">
            <h3>🎓 Academic Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <label>Department</label>
                <span>{{ studentProfile.department?.name || '-' }}</span>
              </div>
              <div class="info-item">
                <label>Program</label>
                <span>{{ studentProfile.program?.name || '-' }}</span>
              </div>
              <div class="info-item">
                <label>Academic Year</label>
                <span>Year {{ studentProfile.academicYear }}</span>
              </div>
              <div class="info-item">
                <label>Status</label>
                <span class="status-badge" :class="studentProfile.academicStatus">
                  {{ studentProfile.academicStatus }}
                </span>
              </div>
            </div>
          </div>

          <div class="info-section">
            <h3>📞 Contact Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <label>Personal Email</label>
                <span>{{ studentProfile.personalEmail }}</span>
              </div>
              <div class="info-item">
                <label>Phone Numbers</label>
                <span>{{ studentProfile.phoneNumbers?.join(', ') || '-' }}</span>
              </div>
              <div class="info-item full-width">
                <label>Emergency Phones</label>
                <span>{{ studentProfile.emergencyPhoneNumbers?.join(', ') || '-' }}</span>
              </div>
            </div>
          </div>
        </template>

        <!-- Teacher Profile Details -->
        <template v-if="isTeacher && teacherProfile">
          <div class="info-section">
            <h3>👤 Personal Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <label>Name (Khmer)</label>
                <span>{{ teacherProfile.nameKhmer }}</span>
              </div>
              <div class="info-item">
                <label>Name (Latin)</label>
                <span>{{ teacherProfile.nameLatin }}</span>
              </div>
              <div class="info-item">
                <label>Gender</label>
                <span>{{ teacherProfile.gender === 'male' ? '👨 Male' : '👩 Female' }}</span>
              </div>
              <div class="info-item">
                <label>Date of Birth</label>
                <span>{{ formatDate(teacherProfile.dob) }}</span>
              </div>
            </div>
          </div>

          <div class="info-section">
            <h3>🏢 Department</h3>
            <div class="info-grid">
              <div class="info-item">
                <label>Department</label>
                <span>{{ teacherProfile.department?.name || '-' }}</span>
              </div>
            </div>
          </div>

          <div class="info-section">
            <h3>📞 Contact Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <label>Personal Email</label>
                <span>{{ teacherProfile.personalEmail }}</span>
              </div>
              <div class="info-item">
                <label>Phone Numbers</label>
                <span>{{ teacherProfile.phoneNumbers?.join(', ') || '-' }}</span>
              </div>
            </div>
          </div>
        </template>

        <!-- Admin Profile (basic info only) -->
        <template v-if="isAdmin && !studentProfile && !teacherProfile">
          <div class="info-section">
            <h3>👑 Admin Account</h3>
            <p class="admin-note">You are logged in as an administrator.</p>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<style scoped>
.profile-page {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  font-size: 24px;
  color: #1f2937;
  margin-bottom: 24px;
}

.loading {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.alert-error {
  padding: 12px 16px;
  background: #fef2f2;
  color: #b91c1c;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid #fecaca;
}

.profile-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
}

.profile-avatar {
  flex-shrink: 0;
}

.avatar-img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid rgba(255, 255, 255, 0.3);
}

.avatar-placeholder {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  font-weight: 600;
  border: 4px solid rgba(255, 255, 255, 0.3);
}

.profile-info h2 {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.role-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.2);
}

.info-section {
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.info-section:last-child {
  border-bottom: none;
}

.info-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 16px 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item.full-width {
  grid-column: span 2;
}

.info-item label {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-item span {
  font-size: 15px;
  color: #1f2937;
}

.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  text-transform: capitalize;
}

.status-badge.active {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.suspended {
  background: #fee2e2;
  color: #b91c1c;
}

.status-badge.leave {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.graduation {
  background: #dbeafe;
  color: #1e40af;
}

.admin-note {
  color: #6b7280;
  font-style: italic;
}

@media (max-width: 600px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .info-item.full-width {
    grid-column: span 1;
  }
}
</style>
