<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE } from '@/config'

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function login() {
  error.value = ''
  loading.value = true

  try {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
      }),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(data.message || 'Login failed')
    }

    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))

    router.push('/')
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <h1>Welcome Back</h1>
        <p>Sign in to your account to continue</p>
      </div>
      <form @submit.prevent="login" class="auth-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="Enter your email"
            required
          />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Enter your password"
            required
          />
        </div>
        <p v-if="error" class="error">{{ error }}</p>
        <button type="submit" :disabled="loading" class="auth-btn">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
        <p class="auth-footer">
          Don't have an account? <router-link to="/signup">Sign up</router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}
.auth-card {
  background: white;
  padding: 3rem;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 420px;
}
.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}
.auth-header h1 {
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}
.auth-header p {
  color: #666;
}
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.form-group label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
}
input {
  padding: 0.9rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s ease;
  outline: none;
}
input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}
.auth-btn {
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 0.5rem;
}
.auth-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}
.auth-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.error {
  background: #fee;
  color: #e74c3c;
  padding: 0.75rem;
  border-radius: 8px;
  margin: 0;
  font-size: 0.9rem;
}
.auth-footer {
  text-align: center;
  color: #666;
  margin: 0;
}
.auth-footer a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}
.auth-footer a:hover {
  text-decoration: underline;
}
</style>
