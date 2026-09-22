<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE } from '@/config'
import { useMpesa } from '@/composables/useMpesa'

const router = useRouter()
const { loading: mpesaLoading, stkPushed, checkoutRequestId, polling, initiateStkPush, pollStkPush, stopPolling } = useMpesa()

const orders = ref([])
const loading = ref(true)
const error = ref('')
const payingId = ref(null)
const paymentMessage = ref('')

function formatMoney(value) {
  return `KSh ${Number(value || 0).toLocaleString()}`
}

function formatDate(value) {
  if (!value) return 'Pending'

  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatStatus(value, fallback = 'Placed') {
  const status = String(value || fallback).replace(/_/g, ' ')

  return status.charAt(0).toUpperCase() + status.slice(1)
}

function orderTotal(order) {
  return Number(order.product?.price || 0) * Number(order.quantity || 0)
}

function getPaymentStatus(order) {
  return order.payment?.payment_status || 'pending'
}

/*
|--------------------------------------------------------------------------
| Pay for an existing pending order (M-Pesa STK Push)
|--------------------------------------------------------------------------
*/

async function payOrder(order) {
  const payment = order.payment

  if (!payment) {
    error.value = 'No payment was found for this order.'
    return
  }

  if (payment.payment_status !== 'pending') {
    return
  }

  payingId.value = order.id
  error.value = ''
  paymentMessage.value = ''

  try {
    const result = await initiateStkPush(payment.id)

    if (result.success) {
      paymentMessage.value = result.customerMessage || 'STK Push sent! Please enter your M-Pesa PIN on your phone.'

      await pollStkPush(
        payment.id,
        async (pollResult) => {
          paymentMessage.value = 'Payment successful!'
          await fetchOrders()
          setTimeout(() => {
            paymentMessage.value = ''
            payingId.value = null
          }, 3000)
        },
        (err) => {
          error.value = err.message
          payingId.value = null
        }
      )
    }
  } catch (err) {
    error.value = err.message || 'Payment failed.'
    payingId.value = null
  }
}

/*
|--------------------------------------------------------------------------
| Fetch orders
|--------------------------------------------------------------------------
*/

onMounted(() => {
  const token = localStorage.getItem('token')

  if (!token) {
    router.push('/login')
    return
  }

  fetchOrders()
})

async function fetchOrders() {
  loading.value = true
  error.value = ''

  const token = localStorage.getItem('token')

  try {
    const response = await fetch(`${API_BASE}/orders`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    const text = await response.text()

    let data

    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
        return
      }

      throw new Error(
        data?.message ||
        data?.error ||
        text ||
        `Request failed with status ${response.status}`
      )
    }

    orders.value = Array.isArray(data) ? data : []
  } catch (err) {
    error.value = err.message || 'Failed to load orders.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="orders-page">

    <!-- Page Header -->
    <div class="page-header">
      <h1>My Orders</h1>
      <p>Track and manage your orders</p>
    </div>

    <!-- Payment Success -->
    <div
      v-if="paymentMessage"
      class="payment-success"
    >
      ✓ {{ paymentMessage }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading your orders...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-box">
      <p>{{ error }}</p>

      <button
        class="btn btn-primary"
        @click="fetchOrders"
      >
        Try Again
      </button>
    </div>

    <!-- No Orders -->
    <div v-else-if="orders.length === 0" class="empty">

      <div class="empty-icon">📦</div>

      <h2>No orders yet</h2>

      <p>
        You haven't placed any orders yet.
      </p>

      <button
        class="btn btn-primary"
        @click="router.push('/products')"
      >
        Start Shopping
      </button>

    </div>

    <!-- Orders -->
    <div v-else class="orders-list">

      <div
        v-for="order in orders"
        :key="order.id"
        class="order-card"
      >

        <!-- Order Header -->
        <div class="order-header">

          <div class="order-info">

            <span class="order-id">
              Order #{{ order.id }}
            </span>

            <span class="order-date">
              {{ formatDate(order.created_at) }}
            </span>

          </div>

          <div class="order-statuses">

            <!-- Order Status -->
            <span
              class="order-status"
              :class="`status-${String(order.status || 'placed').toLowerCase()}`"
            >
              {{ formatStatus(order.status, 'Placed') }}
            </span>

            <!-- Payment Status -->
            <span
              class="payment-status"
              :class="`payment-${getPaymentStatus(order).toLowerCase()}`"
            >
              Payment:
              {{ formatStatus(getPaymentStatus(order), 'Pending') }}
            </span>

          </div>

        </div>

        <!-- Order Body -->
        <div class="order-body">

          <!-- Product -->
          <div class="product-summary">

            <img
              v-if="order.product?.image"
              :src="order.product.image"
              :alt="order.product?.name || 'Product'"
              class="product-image"
            />

            <div
              v-else
              class="product-placeholder"
            >
              No Image
            </div>

            <div class="product-details">

              <h3>
                {{ order.product?.name || `Product #${order.product_id}` }}
              </h3>

              <p>
                {{ order.product?.category || 'Product' }}
              </p>

            </div>

          </div>

          <!-- Order Metrics -->
          <div class="order-metrics">

            <div class="order-item">

              <span class="label">
                Price
              </span>

              <span class="value">
                {{ formatMoney(order.product?.price) }}
              </span>

            </div>

            <div class="order-item">

              <span class="label">
                Quantity
              </span>

              <span class="value">
                {{ order.quantity }}
              </span>

            </div>

            <div class="order-item">

              <span class="label">
                Total
              </span>

              <span class="value total">
                {{ formatMoney(orderTotal(order)) }}
              </span>

            </div>

          </div>

        </div>

        <!-- Payment Information -->
        <div
          v-if="order.payment"
          class="payment-info"
        >

          <div class="payment-amount">
            <span>
              Payment amount:
            </span>

            <strong>
              {{ formatMoney(order.payment.amount) }}
            </strong>
          </div>

          <!-- Pending Payment -->
          <div v-if="getPaymentStatus(order) === 'pending'">
            <!-- M-Pesa Polling Status for this order -->
            <div v-if="payingId === order.id && (stkPushed && polling)" class="mpesa-polling-inline">
              <div class="polling-spinner-small"></div>
              <span>Waiting for M-Pesa PIN... ({{ checkoutRequestId }})</span>
            </div>
            <div v-else-if="payingId === order.id && stkPushed && !polling" class="mpesa-polling-inline">
              <div class="polling-spinner-small"></div>
              <span>Checking payment status...</span>
            </div>
            <button
              v-else
              class="btn btn-pay"
              :disabled="payingId === order.id || mpesaLoading"
              @click="payOrder(order)"
            >
              <span v-if="payingId === order.id || mpesaLoading" class="btn-spinner"></span>
              {{ (payingId === order.id || mpesaLoading) ? 'Sending STK Push...' : '📱 Pay with M-Pesa' }}
            </button>
          </div>

          <!-- Paid Payment -->
          <div
            v-else-if="getPaymentStatus(order) === 'paid'"
            class="paid-badge"
          >
            ✓ Paid
          </div>

          <!-- Failed Payment -->
          <div
            v-else-if="getPaymentStatus(order) === 'failed'"
            class="failed-badge"
          >
            Payment Failed
          </div>

        </div>

      </div>

    </div>

  </div>
</template>

<style scoped>
.orders-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  color: #2c3e50;
  margin: 0 0 0.25rem;
}

.page-header p {
  color: #666;
  margin: 0;
}

/* Payment Success */

.payment-success {
  margin-bottom: 1.5rem;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  background: #eafaf1;
  border: 1px solid #b7e4c7;
  color: #1e8449;
  font-weight: 600;
}

/* Loading */

.loading {
  text-align: center;
  padding: 3rem 0;
  color: #666;
}

.spinner {
  width: 50px;
  height: 50px;
  margin: 0 auto 1rem;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Error */

.error-box {
  text-align: center;
  padding: 2rem;
  background: #fff5f5;
  border: 1px solid #ffd6d6;
  border-radius: 16px;
  color: #b42318;
}

.error-box p {
  margin-bottom: 1rem;
}

/* Empty */

.empty {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty h2 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.empty p {
  color: #666;
  margin-bottom: 1.5rem;
}

/* Orders */

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.order-card {
  background: white;
  border-radius: 16px;
  padding: 1.25rem;
  border: 1px solid #f0f0f0;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.order-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
}

/* Header */

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f0f0f0;
}

.order-info {
  min-width: 0;
}

.order-id {
  display: block;
  font-weight: 700;
  color: #2c3e50;
}

.order-date {
  display: block;
  margin-top: 0.2rem;
  color: #666;
  font-size: 0.85rem;
}

.order-statuses {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.35rem;
}

/* Order Status */

.order-status {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  background: #eafaf1;
  color: #1e8449;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-cancelled {
  background: #fdecec;
  color: #b42318;
}

.status-shipped {
  background: #eef4ff;
  color: #2457a6;
}

.status-delivered {
  background: #eafaf1;
  color: #1e8449;
}

/* Payment Status */

.payment-status {
  color: #667085;
  font-size: 0.75rem;
  font-weight: 600;
}

.payment-paid {
  color: #1e8449;
}

.payment-failed {
  color: #b42318;
}

.payment-refunded {
  color: #856404;
}

.payment-pending {
  color: #b7791f;
}

/* Order Body */

.order-body {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) auto;
  gap: 2rem;
  align-items: center;
}

/* Product */

.product-summary {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
}

.product-image,
.product-placeholder {
  width: 64px;
  height: 64px;
  flex: 0 0 64px;
  border-radius: 10px;
}

.product-image {
  object-fit: cover;
}

.product-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f4f6f8;
  color: #999;
  font-size: 0.75rem;
  text-align: center;
}

.product-details {
  min-width: 0;
}

.product-details h3 {
  margin: 0 0 0.25rem;
  color: #2c3e50;
  font-size: 1rem;
}

.product-details p {
  margin: 0;
  color: #666;
}

/* Metrics */

.order-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(80px, auto));
  gap: 1.25rem;
}

.order-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.order-item .label {
  color: #666;
  font-size: 0.8rem;
  text-transform: uppercase;
}

.order-item .value {
  color: #2c3e50;
  font-weight: 600;
}

.order-item .total {
  color: #e74c3c;
}

/* Payment */

.payment-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
  color: #666;
  font-size: 0.85rem;
}

.payment-amount {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.payment-info strong {
  color: #2c3e50;
}

/* Buttons */

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.7rem 1.25rem;
  border: none;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.btn-pay {
  background: linear-gradient(135deg, #16a085 0%, #27ae60 100%);
  color: white;
  min-width: 130px;
}

.btn-pay:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(39, 174, 96, 0.25);
}

.paid-badge {
  padding: 0.7rem 1.1rem;
  border-radius: 10px;
  background: #eafaf1;
  color: #1e8449;
  font-weight: 700;
}

.failed-badge {
  padding: 0.7rem 1.1rem;
  border-radius: 10px;
  background: #fdecec;
  color: #b42318;
  font-weight: 700;
}

/* M-Pesa Polling Inline */
.mpesa-polling-inline {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f0f7ff;
  border-radius: 8px;
  color: #0066cc;
  font-size: 0.8rem;
  font-weight: 500;
}

.mpesa-polling-inline .polling-spinner-small {
  width: 14px;
  height: 14px;
  border: 2px solid #d0e6ff;
  border-top: 2px solid #0066cc;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Flutterwave Loading */
.btn-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 0.5rem;
  border: 2px solid #ffffff;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  vertical-align: middle;
}

/* Responsive */

@media (max-width: 720px) {
  .orders-page {
    padding: 1rem;
  }

  .order-header {
    align-items: flex-start;
  }

  .order-body {
    grid-template-columns: 1fr;
  }

  .order-metrics {
    grid-template-columns: repeat(3, 1fr);
  }

  .payment-info {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .order-header {
    flex-direction: column;
  }

  .order-statuses {
    align-items: flex-start;
  }

  .order-metrics {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .payment-info {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-pay {
    width: 100%;
  }
}
</style>
