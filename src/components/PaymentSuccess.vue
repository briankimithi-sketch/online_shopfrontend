<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { API_BASE } from '@/config'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const error = ref('')
const success = ref('')
const paymentData = ref(null)

onMounted(async () => {
  const token = localStorage.getItem('token')

  if (!token) {
    router.push('/login')
    return
  }

  const txRef = route.query.tx_ref

  if (!txRef) {
    error.value = 'Missing transaction reference.'
    loading.value = false
    return
  }

  try {
    // Verify payment status with backend
    const response = await fetch(`${API_BASE}/payments/flutterwave/success?tx_ref=${txRef}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    const data = await response.json().catch(() => ({}))

    if (response.ok && data.tx_ref) {
      success.value = 'Payment completed successfully!'
      paymentData.value = data
    } else {
      // Try to get payment details from orders
      await verifyPaymentWithOrders(txRef)
    }
  } catch (err) {
    error.value = 'Failed to verify payment. Please check your orders page.'
    console.error('Payment verification error:', err)
  } finally {
    loading.value = false
  }
})

async function verifyPaymentWithOrders(txRef) {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE}/orders`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    const orders = await response.json().catch(() => [])

    // Find order with matching tx_ref
    const order = orders.find(o => o.payment?.flutterwave_tx_ref === txRef)

    if (order) {
      paymentData.value = { tx_ref: txRef, order }
      if (order.payment?.payment_status === 'paid') {
        success.value = 'Payment completed successfully!'
      } else {
        success.value = 'Payment is being processed. Please check your orders page shortly.'
      }
    } else {
      success.value = 'Payment completed! Please check your orders page for details.'
    }
  } catch (err) {
    success.value = 'Payment completed! Please check your orders page for details.'
  }
}

function goToOrders() {
  router.push('/orders')
}

function goToHome() {
  router.push('/')
}
</script>

<template>
  <div class="payment-result-page">
    <div class="result-card">

      <!-- Loading -->
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Verifying your payment...</p>
      </div>

      <!-- Success -->
      <div v-else-if="success && !error" class="success-state">
        <div class="success-icon">✓</div>
        <h1>Payment Successful!</h1>
        <p class="success-message">{{ success }}</p>

        <div v-if="paymentData?.tx_ref" class="tx-ref">
          Transaction Reference: <strong>{{ paymentData.tx_ref }}</strong>
        </div>

        <div class="actions">
          <button @click="goToOrders" class="btn btn-primary">
            View My Orders
          </button>
          <button @click="goToHome" class="btn btn-secondary">
            Continue Shopping
          </button>
        </div>
      </div>

      <!-- Error -->
      <div v-else class="error-state">
        <div class="error-icon">✕</div>
        <h1>Payment Verification Issue</h1>
        <p class="error-message">{{ error || 'Unable to verify payment status.' }}</p>
        <p class="error-hint">
          Don't worry, your payment may still be processing. Please check your orders page.
        </p>

        <div class="actions">
          <button @click="goToOrders" class="btn btn-primary">
            Check My Orders
          </button>
          <button @click="goToHome" class="btn btn-secondary">
            Go Home
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.payment-result-page {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.result-card {
  width: 100%;
  max-width: 500px;
  background: white;
  border-radius: 20px;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
}

.loading {
  color: #666;
}

.spinner {
  width: 50px;
  height: 50px;
  margin: 0 auto 1.5rem;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.success-icon,
.error-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  font-size: 2.5rem;
  font-weight: bold;
}

.success-icon {
  background: #eafaf1;
  color: #1e8449;
}

.error-icon {
  background: #fdecec;
  color: #b42318;
}

h1 {
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 1.75rem;
}

.success-message {
  color: #1e8449;
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.error-message {
  color: #b42318;
  margin-bottom: 0.5rem;
}

.error-hint {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 2rem;
}

.tx-ref {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 10px;
  margin-bottom: 2rem;
  color: #666;
  font-size: 0.9rem;
}

.tx-ref strong {
  color: #2c3e50;
  font-family: monospace;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.85rem 1.5rem;
  border-radius: 10px;
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

.btn-secondary {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
}

.btn-secondary:hover {
  background: #667eea;
  color: white;
}
</style>