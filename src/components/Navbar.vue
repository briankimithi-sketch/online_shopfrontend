<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCart } from '@/composables/useCart'

const router = useRouter()
const isAuthenticated = ref(false)
const user = ref(null)
const { count } = useCart()

onMounted(() => {
  const token = localStorage.getItem('token')
  const userData = localStorage.getItem('user')
  if (token && userData) {
    isAuthenticated.value = true
    user.value = JSON.parse(userData)
  }
})

function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  isAuthenticated.value = false
  user.value = null
  router.push('/')
}
</script>

<template>
  <nav class="navbar">
    <div class="nav-container">
      <div class="nav-brand">
        <router-link to="/">
          <span class="logo">🛒</span>
          <span class="brand-text">Online Shop</span>
        </router-link>
      </div>
      <div class="nav-links">
        <router-link to="/" class="nav-link">Home</router-link>
        <router-link to="/products" class="nav-link">Products</router-link>
        <template v-if="!isAuthenticated">
          <router-link to="/login" class="nav-link">Login</router-link>
          <router-link to="/signup" class="nav-link nav-link-primary">Sign Up</router-link>
        </template>
        <template v-else>
          <router-link to="/profile" class="nav-link">Profile</router-link>
          <router-link v-if="Number(user?.role_id) === 1" to="/admin" class="nav-link">Admin</router-link>
          <router-link to="/orders" class="nav-link">Orders</router-link>
          <router-link to="/cart" class="nav-link cart-link">
            Cart
            <span v-if="count > 0" class="cart-badge">{{ count }}</span>
          </router-link>
          <button @click="logout" class="logout-btn">Logout</button>
        </template>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  background: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}
.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 70px;
}
.nav-brand a {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  font-size: 1.5rem;
  font-weight: 800;
  color: #2c3e50;
}
.logo {
  font-size: 1.8rem;
}
.brand-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.nav-links {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.nav-link {
  color: #666;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.3s ease;
}
.nav-link:hover {
  color: #667eea;
  background: #f5f7ff;
}
.nav-link-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white !important;
}
.nav-link-primary:hover {
  background: linear-gradient(135deg, #5a67d8 0%, #6b46a1 100%);
  color: white !important;
  transform: translateY(-1px);
}
.logout-btn {
  background: none;
  border: 1px solid #e74c3c;
  color: #e74c3c;
  padding: 0.5rem 1.2rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}
.logout-btn:hover {
  background-color: #e74c3c;
  color: white;
}
.cart-link {
  position: relative;
}
.cart-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  background: #e74c3c;
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.1rem 0.4rem;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}
</style>
