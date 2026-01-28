<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authService, type LoginDto } from '@/services/auth'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const error = ref('')

const form = ref<LoginDto>({
  email: '',
  password: '',
})

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
  <div class="login-container">
    <div class="login-card">
      <h1>Login</h1>
      <p class="subtitle">Sign in to your account</p>

      <div v-if="error" class="alert alert-error">{{ error }}</div>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            placeholder="Enter your email"
            autocomplete="username"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            placeholder="Enter your password"
            autocomplete="current-password"
          />
        </div>

        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  padding: 20px;
}

.login-card {
  background: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.login-card h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  text-align: center;
}

.subtitle {
  color: #666;
  text-align: center;
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #374151;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 16px;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
}

.btn-primary {
  background: #4f46e5;
  color: white;
}

.btn-primary:hover {
  background: #4338ca;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.btn-block {
  width: 100%;
}

.alert-error {
  padding: 12px;
  background: #fee2e2;
  color: #b91c1c;
  border-radius: 6px;
  margin-bottom: 20px;
  text-align: center;
}
</style>
