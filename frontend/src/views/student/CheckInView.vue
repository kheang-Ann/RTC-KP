<script setup lang="ts">
import { ref } from 'vue'
import { attendanceService } from '@/services/attendance'

const code = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)
const checkInResult = ref<{ courseName?: string; sessionTitle?: string } | null>(null)

async function handleCheckIn() {
  if (!code.value.trim()) {
    error.value = 'Please enter an attendance code'
    return
  }

  loading.value = true
  error.value = ''
  success.value = false

  try {
    const result = await attendanceService.checkIn(code.value.trim().toUpperCase())
    success.value = true
    checkInResult.value = {
      courseName: result.session?.courseId,
      sessionTitle: 'Session',
    }
    code.value = ''
  } catch (e) {
    error.value = (e as Error).message || 'Failed to check in. Please check the code and try again.'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  code.value = ''
  error.value = ''
  success.value = false
  checkInResult.value = null
}
</script>

<template>
  <div class="check-in-page">
    <h1>Check In</h1>
    <p class="subtitle">Enter the attendance code provided by your teacher</p>

    <div class="check-in-card">
      <!-- Success State -->
      <div v-if="success" class="success-state">
        <div class="success-icon">✓</div>
        <h2>Check-in Successful!</h2>
        <p>Your attendance has been recorded.</p>
        <button class="btn btn-primary" @click="resetForm">Check In Again</button>
      </div>

      <!-- Check-in Form -->
      <form v-else @submit.prevent="handleCheckIn">
        <div v-if="error" class="alert alert-error">{{ error }}</div>

        <div class="code-input-wrapper">
          <input
            v-model="code"
            type="text"
            class="code-input"
            placeholder="Enter 6-digit code"
            maxlength="8"
            autocomplete="off"
            :disabled="loading"
          />
        </div>

        <button type="submit" class="btn btn-primary btn-block" :disabled="loading || !code.trim()">
          {{ loading ? 'Checking in...' : 'Check In' }}
        </button>
      </form>

      <div class="tips">
        <h3>Tips</h3>
        <ul>
          <li>The code is case-insensitive</li>
          <li>Ask your teacher if you don't have the code</li>
          <li>Make sure you're checking in during the class session</li>
        </ul>
      </div>
    </div>

    <router-link to="/student/dashboard" class="back-link">← Back to Dashboard</router-link>
  </div>
</template>

<style scoped>
.check-in-page {
  padding: 1rem;
  max-width: 500px;
  margin: 0 auto;
}

h1 {
  text-align: center;
  margin-bottom: 0.25rem;
}

.subtitle {
  text-align: center;
  color: var(--color-grey);
  margin-bottom: 2rem;
}

.check-in-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.code-input-wrapper {
  margin-bottom: 1.5rem;
}

.code-input {
  width: 90%;
  padding: 1rem;
  font-size: 2rem;
  text-align: center;
  letter-spacing: 0.5rem;
  text-transform: uppercase;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-family: monospace;
  transition: border-color 0.2s;
}

.code-input:focus {
  outline: none;
  border-color: #007bff;
}

.code-input::placeholder {
  font-size: 1rem;
  letter-spacing: normal;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-block {
  width: 100%;
}

.success-state {
  text-align: center;
  padding: 1rem;
}

.success-icon {
  width: 80px;
  height: 80px;
  background: #28a745;
  color: white;
  font-size: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.success-state h2 {
  color: #28a745;
  margin-bottom: 0.5rem;
}

.success-state p {
  color: var(--color-grey);
  margin-bottom: 1.5rem;
}

.tips {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
}

.tips h3 {
  font-size: 0.875rem;
  color: var(--color-grey);
  margin-bottom: 0.5rem;
}

.tips ul {
  margin: 0;
  padding-left: 1.25rem;
  color: #888;
  font-size: 0.875rem;
}

.tips li {
  margin-bottom: 0.25rem;
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

.back-link {
  display: block;
  text-align: center;
  margin-top: 1.5rem;
  color: #007bff;
  text-decoration: none;
}

.back-link:hover {
  text-decoration: underline;
}
</style>
