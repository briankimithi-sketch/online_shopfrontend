<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const cancelled = ref(false)
const txRef = route.query.tx_ref || ''

function goToCart() {
  router.push('/cart')
}

function goToOrders() {
  router.push('/orders')
}

function goToHome() {
  router.push('/')
}

function retryPayment() {
  if (txRef) {
    router.push('/cart')
  } else {
    router.push('/cart')
  }
}
</script>

<template>
  <div class="payment-result-page">
    <div class="result-card">

      <div class="cancel-state">
        <div class="cancel-icon">✕</div>
        <h1>Payment Cancelled</h1>
        <p class="cancel-message">
          Your payment was not completed.
        </p>

        <div v-if="txRef" class="tx-ref">
          Transaction Reference: <strong>{{ txRef }}</strong>
        </div>

        <p class="cancel-hint">
          No charges were made. You can try again or continue shopping.
        </p>

        <div class="actions">
          <button @click="retryPayment" class="btn btn-primary">
            Try Payment Again
          </button>
          <button @click="goToCart" class="btn btn-secondary">
            Back to Cart
          </button>
          <button @click="goToHome" class="btn btn-outline">
            Continue Shopping
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
  border: 1px solid #f0f0f0.
}

.cancel-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #fff3cd;
  color: #856404;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  font-size: 2.5rem;
  font-weight: bold;
}

h1 {
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 1.75rem;
}

.cancel-message {
  color: #856404;
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.cancel-hint {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 2rem;
}

.tx-ref {
  background: #fff3cd;
  padding: 1rem;
  border-radius: 10px;
  margin-bottom: 2rem;
  color: #856404;
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
  background: linear-gradient(135deg, #16a085 0%, #27ae60 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(39, 174, 96, 0.3);
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

.btn-outline {
  background: transparent;
  color: #666;
  border: 2px solid #e0e0e0;
}

.btn-outline:hover {
  border-color: #666;
  color: #666;
}
</style>