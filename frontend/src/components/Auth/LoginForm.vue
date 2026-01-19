<template>
  <link href="https://cdn.jsdelivr.net/npm/remixicon@4.8.0/fonts/remixicon.css" rel="stylesheet" />
  <div class="login-container">
    <div class="login-card">
      <!-- Logo and Title -->
      <div class="logo-section">
        <div class="logo">
          <i class="ri-graduation-cap-line"></i>
          <!-- Graduation Cap -->
          <path
            d="M 20 50 L 50 30 L 80 50 L 75 55 L 50 38 L 25 55 Z"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          />
          <!-- Cap Top -->
          <ellipse
            cx="50"
            cy="30"
            rx="30"
            ry="8"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          />
          <!-- Tassel -->
          <line x1="50" y1="38" x2="50" y2="70" stroke="currentColor" stroke-width="2" />
          <!-- Cap Base -->
          <rect
            x="20"
            y="50"
            width="60"
            height="10"
            rx="5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          />
          <!-- Bottom of cap (mortarboard) -->
          <path d="M 15 55 Q 50 75 85 55" fill="none" stroke="currentColor" stroke-width="2" />
        </div>
        <h1 class="title">RTC Student Management System</h1>
      </div>

      <!-- Login Form -->
      <div class="form-section">
        <h2 class="form-title">Login</h2>

        <form @submit.prevent="handleLogin">
          <!-- Email Input -->
          <div class="form-group">
            <label for="email" class="form-label">Email Address</label>
            <div class="input-wrapper">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <input
                id="email"
                v-model="formData.email"
                type="email"
                placeholder="Email"
                class="form-input"
                required
              />
            </div>
          </div>

          <!-- Password Input -->
          <div class="form-group">
            <label for="password" class="form-label">Password</label>
            <div class="input-wrapper">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M 7 11V 7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="password"
                v-model="formData.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Enter your password"
                class="form-input"
                required
              />
              <button type="button" class="eye-button" @click="showPassword = !showPassword">
                <svg v-if="!showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                  />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Remember Me Checkbox -->
          <div class="checkbox-group">
            <input
              id="remember"
              v-model="formData.rememberMe"
              type="checkbox"
              class="checkbox-input"
            />
            <label for="remember" class="checkbox-label">Remember me</label>
          </div>

          <!-- Forgot Password Link -->
          <div class="forgot-password">
            <router-link to="/forgot-password" class="forgot-link">Forgot Password?</router-link>
          </div>

          <!-- Sign In Button -->
          <button type="submit" class="signin-button" :disabled="isLoading">
            {{ isLoading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <!-- Register Link -->
        <div class="register-section">
          <p class="register-text">
            Don't have an account?
            <router-link to="/register" class="register-link">Register here</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const showPassword = ref(false)
const isLoading = ref(false)

const formData = reactive({
  email: '',
  password: '',
  rememberMe: false,
})

const handleLogin = async () => {
  isLoading.value = true
  try {
    // TODO: Replace with actual API call
    console.log('Login attempt:', {
      email: formData.email,
      password: formData.password,
      rememberMe: formData.rememberMe,
    })

    // Example: const response = await loginApi(formData.email, formData.password)

    // Temporary redirect for testing
    setTimeout(() => {
      router.push('/dashboard')
    }, 1000)
  } catch (error) {
    console.error('Login error:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.ri-graduation-cap-line {
  font-size: 48px;
}
.login-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f3460 0%, #1a5490 100%);
  padding: 20px;
  font-family: 'Lato', sans-serif;
  z-index: 9999;
}

.login-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 450px;
  overflow: hidden;
}

.logo-section {
  background: linear-gradient(135deg, #0f3460 0%, #1a5490 100%);
  padding: 40px 20px;
  text-align: center;
  color: white;
}

.logo {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0f3460;
}

.logo svg {
  width: 50px;
  height: 50px;
}

.title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.4;
}

.form-section {
  padding: 40px 30px;
}

.form-title {
  margin: 0 0 30px;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 12px;
  width: 18px;
  height: 18px;
  color: #999;
  pointer-events: none;
  flex-shrink: 0;
  stroke-width: 2;
}

.form-input {
  width: 100%;
  padding: 12px 12px 12px 42px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #1a5490;
  box-shadow: 0 0 0 3px rgba(26, 84, 144, 0.1);
}

.form-input::placeholder {
  color: #bbb;
}

.eye-button {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  transition: color 0.3s ease;
}

.eye-button:hover {
  color: #666;
}

.eye-button svg {
  width: 18px;
  height: 18px;
  stroke-width: 2;
}

.checkbox-group {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #1a5490;
}

.checkbox-label {
  margin-left: 8px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  user-select: none;
}

.forgot-password {
  text-align: right;
  margin-bottom: 20px;
}

.forgot-link {
  font-size: 14px;
  color: #1a5490;
  text-decoration: none;
  transition: color 0.3s ease;
}

.forgot-link:hover {
  color: #0f3460;
  text-decoration: underline;
}

.signin-button {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #0f3460 0%, #1a5490 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 20px;
}

.signin-button:hover:not(:disabled) {
  box-shadow: 0 8px 24px rgba(26, 84, 144, 0.4);
  transform: translateY(-2px);
}

.signin-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.register-section {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.register-text {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.register-link {
  color: #1a5490;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s ease;
}

.register-link:hover {
  color: #0f3460;
  text-decoration: underline;
}

/* Responsive Design */
@media (max-width: 480px) {
  .login-container {
    padding: 15px;
  }

  .login-card {
    max-width: 100%;
  }

  .logo-section {
    padding: 30px 20px;
  }

  .logo {
    width: 70px;
    height: 70px;
  }

  .logo svg {
    width: 40px;
    height: 40px;
  }

  .title {
    font-size: 20px;
  }

  .form-section {
    padding: 30px 20px;
  }

  .form-title {
    font-size: 18px;
  }
}
</style>
