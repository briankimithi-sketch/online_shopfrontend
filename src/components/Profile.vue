<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE } from '@/config'

const router = useRouter()
const user = ref(null)
const orders = ref([])
const loading = ref(true)
const error = ref('')

function formatMoney(value) {
  return `KSh${Number(value || 0).toLocaleString()}`
}

function orderTotal(order) {
  return Number(order.product?.price || 0) * Number(order.quantity || 0)
}

function formatStatus(value, fallback = 'Processing') {
  const status = String(value || fallback).replace(/_/g, ' ')
  return status.charAt(0).toUpperCase() + status.slice(1)
}

onMounted(() => {
  const token = localStorage.getItem('token')
  const userData = localStorage.getItem('user')
  if (!token || !userData) {
    router.push('/login')
    return
  }
  user.value = JSON.parse(userData)
  fetchOrders()
})

async function fetchOrders() {
  loading.value = true
  error.value = ''
  const token = localStorage.getItem('token')

  try {
    const response = await fetch(`${API_BASE}/orders`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
      }
      const data = await response.json().catch(() => ({}))
      throw new Error(data.message || 'Failed to fetch orders')
    }

    orders.value = await response.json().catch(() => [])
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="profile-page">
    <div class="profile-header">
      <div class="avatar">{{ user?.name?.charAt(0)?.toUpperCase() }}</div>
      <div class="profile-info">
        <h1>My Profile</h1>
        <p class="subtitle">Manage your account and view orders</p>
      </div>
    </div>

    <div class="user-card">
      <h2>User Information</h2>
      <div class="user-info">
        <div class="info-item">
          <span class="label">Name</span>
          <span class="value">{{ user?.name }}</span>
        </div>
        <div class="info-item">
          <span class="label">Email</span>
          <span class="value">{{ user?.email }}</span>
        </div>
        <div class="info-item">
          <span class="label">Role ID</span>
          <span class="value">{{ user?.role_id }}</span>
        </div>
      </div>
    </div>

    <section class="orders-section">
      <h2>My Orders</h2>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
      </div>

      <p v-else-if="error" class="error">{{ error }}</p>

      <div v-else-if="orders.length === 0" class="empty">
        <div class="empty-icon">📦</div>
        <p>No orders yet.</p>
        <button @click="router.push('/products')" class="btn btn-primary">Start Shopping</button>
      </div>

      <div v-else class="orders-list">
        <div v-for="order in orders" :key="order.id" class="order-card">
          <div class="order-header">
            <span class="order-id">Order #{{ order.id }}</span>
            <div class="order-statuses">
              <span class="order-status">{{ formatStatus(order.status) }}</span>
              <span class="payment-status">Payment: {{ formatStatus(order.payment_status, 'Pending') }}</span>
            </div>
          </div>
          <div class="order-body">
            <div class="order-product">
              <strong>{{ order.product?.name || `Product #${order.product_id}` }}</strong>
              <span>{{ formatMoney(order.product?.price) }}</span>
            </div>
            <div class="order-item">
              <span class="label">Quantity</span>
              <span class="value">{{ order.quantity }}</span>
            </div>
            <div class="order-item">
              <span class="label">Total</span>
              <span class="value total">{{ formatMoney(orderTotal(order)) }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.profile-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}
.profile-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
}
.avatar {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 700;
}
.profile-info h1 {
  margin: 0;
  color: #2c3e50;
}
.subtitle {
  color: #666;
  margin: 0.25rem 0 0;
}
.user-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}
.user-card h2 {
  margin: 0 0 1rem;
  color: #2c3e50;
  font-size: 1.2rem;
}
.user-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}
.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.info-item .label {
  font-size: 0.8rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.info-item .value {
  font-weight: 600;
  color: #2c3e50;
}
.orders-section {
  margin-top: 2rem;
}
.orders-section h2 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
}
.loading {
  text-align: center;
  margin: 2rem 0;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.error {
  text-align: center;
  margin: 2rem 0;
  color: #e74c3c;
}
.empty {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}
.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}
.empty p {
  color: #666;
  margin-bottom: 1.5rem;
}
.orders-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}
.order-card {
  background: white;
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  border: 1px solid #f0f0f0;
}
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f0f0f0;
}
.order-id {
  font-weight: 700;
  color: #2c3e50;
}
.order-status {
  background: #fff3cd;
  color: #856404;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}
.order-statuses {
  align-items: flex-end;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.payment-status {
  color: #667085;
  font-size: 0.75rem;
  font-weight: 600;
}
.payment-paid { color: #1e8449; }
.payment-failed { color: #b42318; }
.payment-refunded { color: #856404; }
.order-body {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) auto auto;
  gap: 2rem;
  align-items: center;
}
.order-product {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.order-product strong {
  color: #2c3e50;
}
.order-product span {
  color: #666;
  font-size: 0.9rem;
}
.order-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.order-item .label {
  font-size: 0.8rem;
  color: #666;
  text-transform: uppercase;
}
.order-item .value {
  font-weight: 600;
  color: #2c3e50;
}
.order-item .total {
  color: #e74c3c;
}
.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 600;
  cursor: pointer;
  border: none;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}
</style>
