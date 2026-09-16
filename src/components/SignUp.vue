<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE } from '@/config'

const router = useRouter()
const name = ref('')
const email = ref('')
const password = ref('')
const phone = ref('')
const deliveryAddress = ref('')
const roleId = 2
const error = ref('')
const loading = ref(false)

async function signup() {
  error.value = ''
  loading.value = true

  try {
    const response = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        name: name.value,
        email: email.value,
        password: password.value,
        phone: phone.value || null,
        delivery_address: deliveryAddress.value || null,
        role_id: parseInt(roleId.value),
      }),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message = data.message || data.error || 'Registration failed'
      throw new Error(message)
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
        <h1>Create Account</h1>
        <p>Sign up to start shopping</p>
      </div>
      <form @submit.prevent="signup" class="auth-form">
        <div class="form-group">
          <label for="name">Full Name</label>
          <input
            id="name"
            v-model="name"
            type="text"
            placeholder="Enter your full name"
            required
          />
        </div>
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
            placeholder="Create a password"
            required
          />
        </div>
        <div class="form-group">
          <label for="phone">Phone</label>
          <input
            id="phone"
            v-model="phone"
            type="text"
            placeholder="Phone number"
          />
        </div>
        <div class="form-group">
          <label for="deliveryAddress">Delivery Address</label>
          <input
            id="deliveryAddress"
            v-model="deliveryAddress"
            type="text"
            placeholder="Enter your delivery address"
          />
        </div>
        <p v-if="error" class="error">{{ error }}</p>
        <button type="submit" :disabled="loading" class="auth-btn">
          {{ loading ? 'Creating account...' : 'Sign Up' }}
        </button>
        <p class="auth-footer">
          Already have an account? <router-link to="/login">Login</router-link>
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
  max-width: 480px;
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
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
input, .select-input {
  padding: 0.9rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s ease;
  outline: none;
  background: white;
}
input:focus, .select-input:focus {
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
