<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authService, type LoginDto } from '@/services/auth'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const error = ref('')
const showResetModal = ref(false)

const form = ref<LoginDto>({
  email: '',
  password: '',
})

function handleResetPassword() {
  showResetModal.value = true
}

function closeResetModal() {
  showResetModal.value = false
}

async function handleLogin() {
  loading.value = true
  error.value = ''

  try {
    const response = await authService.login(form.value)
    authService.setToken(response.accessToken)
    authService.setUser(response.user)

    // Redirect to intended page or dashboard
    const redirect = (route.query.redirect as string) || '/dashboard'
    router.push(redirect)
  } catch (e) {
    error.value = (e as Error).message || 'Login failed. Please check your credentials.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-wrapper">
    <div class="login-container">
      <!-- Logo and Header -->
      <div class="login-header">
        <div class="logo-wrapper">
          <svg class="logo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <!-- RTC-KP Logo -->
            <defs>
              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color: #3b82f6; stop-opacity: 1" />
                <stop offset="100%" style="stop-color: #2563eb; stop-opacity: 1" />
              </linearGradient>
            </defs>
            <rect x="10" y="10" width="80" height="80" rx="16" fill="url(#logoGradient)" />
            <text x="50" y="65" font-family="Poppins, Arial" font-size="36" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">RTC</text>
          </svg>
        </div>
        <h1 class="app-title">RTC-KP</h1>
        <p class="app-subtitle">School Management System</p>
      </div>

      <!-- Login Card -->
      <div class="login-card">
        <div class="card-header">
          <h2>Log in or create an account to collaborate</h2>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="alert alert-error">
          <span class="error-icon">⚠</span>
          {{ error }}
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="email" class="form-label">Email</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              placeholder="you@example.com"
              autocomplete="username"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="password" class="form-label">Password</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              placeholder="••••••••"
              autocomplete="current-password"
              class="form-input"
            />
          </div>

          <button type="submit" class="btn btn-primary btn-large" :disabled="loading">
            {{ loading ? 'Signing in...' : 'Log in' }}
          </button>
        </form>

        <!-- Links -->
        <div class="form-links">
          <button type="button" class="link-button" @click="handleResetPassword">Reset password</button>
        </div>

        <!-- Reset Password Modal -->
        <div v-if="showResetModal" class="modal-overlay" @click="closeResetModal">
          <div class="modal-box" @click.stop>
            <div class="modal-header">
              <h3>Password Reset</h3>
              <button class="modal-close-btn" @click="closeResetModal">✕</button>
            </div>
            <div class="modal-body">
              <div class="modal-icon">🔐</div>
              <p>To reset your password, please contact the administrator.</p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-primary" @click="closeResetModal">Got it</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  padding: 20px;
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.login-container {
  width: 100%;
  max-width: 480px;
}

.login-header {
  text-align: center;
  margin-bottom: 48px;
}

.logo-wrapper {
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
}

.logo {
  width: 100px;
  height: 100px;
  filter: drop-shadow(0 4px 6px rgba(59, 130, 246, 0.1));
}

.app-title {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  letter-spacing: -0.5px;
}

.app-subtitle {
  margin: 8px 0 0 0;
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.login-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  padding: 48px 32px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.card-header {
  margin-bottom: 32px;
  text-align: center;
}

.card-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.6;
}

.login-form {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  box-sizing: border-box;
  transition: all 0.2s ease;
}

.form-input::placeholder {
  color: #9ca3af;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  background-color: #f0f9ff;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
  transform: translateY(-2px);
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-large {
  width: 100%;
  padding: 14px 24px;
  font-size: 15px;
}

.form-links {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.link-button {
  background: none;
  border: none;
  color: #3b82f6;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  padding: 0;
  transition: color 0.2s ease;
  text-align: center;
}

.link-button:hover {
  color: #2563eb;
  text-decoration: underline;
}

.alert {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.alert-error {
  background: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.error-icon {
  font-size: 16px;
  flex-shrink: 0;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-box {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  max-width: 380px;
  width: 90%;
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.modal-close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #9ca3af;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
}

.modal-close-btn:hover {
  color: #374151;
}

.modal-body {
  padding: 32px 24px;
  text-align: center;
}

.modal-icon {
  font-size: 56px;
  margin-bottom: 16px;
  display: block;
}

.modal-body p {
  margin: 0;
  font-size: 15px;
  color: #4b5563;
  line-height: 1.6;
  font-weight: 500;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 12px;
}

.modal-footer .btn {
  flex: 1;
}

@media (max-width: 480px) {
  .login-card {
    padding: 32px 24px;
  }

  .app-title {
    font-size: 28px;
  }

  .card-header h2 {
    font-size: 18px;
  }

  .form-group {
    margin-bottom: 20px;
  }
}
</style>
