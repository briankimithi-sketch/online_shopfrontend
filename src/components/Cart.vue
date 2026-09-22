<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE } from '@/config'
import { useCart } from '@/composables/useCart'
import { useMpesa } from '@/composables/useMpesa'

const router = useRouter()
const { items, count, total, remove, updateQuantity, clear } = useCart()
const { loading: mpesaLoading, error: mpesaError, stkPushed, checkoutRequestId, polling, initiateStkPush, pollStkPush, stopPolling } = useMpesa()

const loading = ref(false)
const paying = ref(false)
const error = ref('')
const success = ref('')

const payment = ref(null)
const createdOrders = ref([])

onMounted(() => {
  const token = localStorage.getItem('token')

  if (!token) {
    router.push('/login')
  }
})

/*
|--------------------------------------------------------------------------
| Place Order
|--------------------------------------------------------------------------
*/

async function checkout() {
  if (items.value.length === 0) return

  loading.value = true
  error.value = ''
  success.value = ''
  payment.value = null
  createdOrders.value = []

  const token = localStorage.getItem('token')

  if (!token) {
    router.push('/login')
    return
  }

  try {
    /*
     * Create an order for each cart item.
     * The backend automatically creates a pending payment
     * for each order.
     */
    for (const item of items.value) {
      const response = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: item.product_id,
          quantity: item.quantity,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/login')
          return
        }

        throw new Error(
          data.message ||
          data.error ||
          'Failed to place order'
        )
      }

      /*
       * Save the created order.
       */
      if (data.order) {
        createdOrders.value.push(data.order)

        /*
         * Each order has a payment created by Laravel.
         *
         * For now we use the first payment for the Flutterwave
         * payment shown to the customer.
         */
        if (data.order.payment && !payment.value) {
          payment.value = data.order.payment
        }
      }
    }

    /*
     * Don't clear the cart yet.
     *
     * We want the customer to complete the Flutterwave payment first.
     */
    success.value = 'Order created successfully. Please complete payment.'
  } catch (err) {
    error.value = err.message || 'Something went wrong.'
  } finally {
    loading.value = false
  }
}

/*
|--------------------------------------------------------------------------
| M-Pesa STK Push Payment
|--------------------------------------------------------------------------
*/

async function payNow() {
  if (!payment.value) {
    error.value = 'No payment was found for this order.'
    return
  }

  paying.value = true
  error.value = ''
  success.value = ''

  try {
    // Initiate STK Push
    const result = await initiateStkPush(payment.value.id)

    if (result.success) {
      success.value = result.customerMessage || 'STK Push sent! Please enter your M-Pesa PIN on your phone.'

      // Poll for completion
      await pollStkPush(
        payment.value.id,
        (pollResult) => {
          // Payment completed successfully
          clear()
          success.value = 'Payment successful! Your order has been paid.'

          setTimeout(() => {
            router.push('/orders')
          }, 2000)
        },
        (err) => {
          // Payment failed or timed out
          error.value = err.message
          paying.value = false
        }
      )
    }
  } catch (err) {
    error.value = err.message || 'Payment failed.'
    paying.value = false
  }
}
</script>

<template>
  <div class="cart-page">

    <!-- PAGE HEADER -->
    <div class="page-header">
      <h1>Shopping Cart</h1>
      <p>
        {{ count }} item{{ count !== 1 ? 's' : '' }} in your cart
      </p>
    </div>

    <!-- EMPTY CART -->
    <div v-if="items.length === 0 && !payment" class="empty">

      <div class="empty-icon">🛒</div>

      <p>Your cart is empty.</p>

      <button
        @click="router.push('/products')"
        class="btn btn-primary"
      >
        Start Shopping
      </button>

    </div>

    <!-- CART -->
    <div v-else-if="!payment" class="cart-content">

      <div class="cart-items">

        <div
          v-for="item in items"
          :key="item.product_id"
          class="cart-item"
        >

          <!-- IMAGE -->
          <div class="item-image">

            <img
              v-if="item.image"
              :src="item.image"
              :alt="item.name"
            />

            <div
              v-else
              class="placeholder"
            >
              No Image
            </div>

          </div>

          <!-- PRODUCT -->
          <div class="item-info">

            <h3>{{ item.name }}</h3>

            <p class="price">
              KSh {{ item.price }}
            </p>

          </div>

          <!-- QUANTITY -->
          <div class="item-quantity">

            <button
              @click="
                updateQuantity(
                  item.product_id,
                  item.quantity - 1
                )
              "
              class="qty-btn"
            >
              -
            </button>

            <span>{{ item.quantity }}</span>

            <button
              @click="
                updateQuantity(
                  item.product_id,
                  item.quantity + 1
                )
              "
              class="qty-btn"
            >
              +
            </button>

          </div>

          <!-- SUBTOTAL -->
          <div class="item-subtotal">
            <span>
              KSh {{ item.price * item.quantity }}
            </span>
          </div>

          <!-- REMOVE -->
          <button
            @click="remove(item.product_id)"
            class="remove-btn"
          >
            ×
          </button>

        </div>

      </div>

      <!-- SUMMARY -->
      <div class="cart-summary">

        <h2>Order Summary</h2>

        <div class="summary-row">

          <span>Total</span>

          <span class="total-price">
            KSh {{ total }}
          </span>

        </div>

        <p
          v-if="error"
          class="error"
        >
          {{ error }}
        </p>

        <p
          v-if="success"
          class="success"
        >
          {{ success }}
        </p>

        <button
          @click="checkout"
          :disabled="loading"
          class="btn btn-primary checkout-btn"
        >
          {{ loading ? 'Creating Order...' : 'Place Order' }}
        </button>

        <button
          @click="router.push('/products')"
          class="btn btn-secondary"
        >
          Continue Shopping
        </button>

      </div>

    </div>

    <!-- PAYMENT SCREEN -->
    <div
      v-else
      class="payment-page"
    >

      <div class="payment-card">

        <div class="payment-icon">
          💳
        </div>

        <h1>Complete Your Payment</h1>

        <p class="payment-description">
          Your order has been created successfully.
        </p>

        <div class="payment-details">

          <div class="payment-row">

            <span>Payment ID</span>

            <strong>
              #{{ payment.id }}
            </strong>

          </div>

          <div class="payment-row">

            <span>Amount</span>

            <strong class="payment-amount">
              KSh {{ payment.amount }}
            </strong>

          </div>

          <div class="payment-row">

            <span>Status</span>

            <strong
              class="status"
              :class="payment.payment_status"
            >
              {{ payment.payment_status }}
            </strong>

          </div>

        </div>

        <p
          v-if="error"
          class="error"
        >
          {{ error }}
        </p>

        <p
          v-if="success"
          class="success"
        >
          {{ success }}
        </p>

        <!-- M-Pesa STK Push Status -->
        <div v-if="stkPushed && polling" class="mpesa-polling">
          <div class="polling-spinner"></div>
          <p>Waiting for you to enter M-Pesa PIN...</p>
          <p class="polling-hint">Checkout Request: {{ checkoutRequestId }}</p>
        </div>

        <div v-else-if="stkPushed && !polling && payment.payment_status === 'pending'" class="mpesa-polling">
          <div class="polling-spinner"></div>
          <p>Checking payment status...</p>
        </div>

        <button
          v-else-if="payment.payment_status === 'pending' && !stkPushed"
          @click="payNow"
          :disabled="paying || mpesaLoading"
          class="btn btn-pay"
        >
          <span v-if="paying || mpesaLoading" class="btn-spinner"></span>
          {{ (paying || mpesaLoading) ? 'Sending STK Push...' : '📱 Pay with M-Pesa' }}
        </button>

        <div
          v-else-if="payment.payment_status === 'paid'"
          class="paid-message"
        >
          ✓ Payment Completed
        </div>

        <button
          @click="router.push('/orders')"
          class="btn btn-secondary"
        >
          View My Orders
        </button>

      </div>

    </div>

  </div>
</template>

<style scoped>
.cart-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.page-header p {
  color: #666;
}

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

.empty p {
  color: #666;
  margin-bottom: 1.5rem;
}

.cart-content {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 2rem;
  align-items: start;
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cart-item {
  background: white;
  border-radius: 16px;
  padding: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f0f0;
  display: grid;
  grid-template-columns: 80px 1fr auto auto auto;
  gap: 1.5rem;
  align-items: center;
}

.item-image {
  width: 80px;
  height: 80px;
  background: #f8f9fa;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder {
  font-size: 0.75rem;
  color: #999;
  text-align: center;
}

.item-info h3 {
  margin: 0 0 0.25rem;
  font-size: 1rem;
  color: #2c3e50;
}

.item-info .price {
  margin: 0;
  color: #e74c3c;
  font-weight: 700;
}

.item-quantity {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.qty-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  background: white;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qty-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.item-quantity span {
  font-weight: 600;
  min-width: 24px;
  text-align: center;
}

.item-subtotal {
  font-weight: 700;
  color: #2c3e50;
  min-width: 80px;
  text-align: right;
}

.remove-btn {
  background: none;
  border: none;
  color: #999;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
}

.remove-btn:hover {
  color: #e74c3c;
}

.cart-summary {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f0f0;
  position: sticky;
  top: 90px;
}

.cart-summary h2 {
  margin: 0 0 1rem;
  font-size: 1.25rem;
  color: #2c3e50;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-top: 1px solid #f0f0f0;
  margin-bottom: 1rem;
}

.total-price {
  font-size: 1.5rem;
  font-weight: 800;
  color: #e74c3c;
}

/* PAYMENT */

.payment-page {
  display: flex;
  justify-content: center;
  padding: 2rem 0;
}

.payment-card {
  width: 100%;
  max-width: 520px;
  background: white;
  border-radius: 20px;
  padding: 2.5rem;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
}

.payment-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.payment-card h1 {
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.payment-description {
  color: #666;
  margin-bottom: 2rem;
}

.payment-details {
  background: #f8f9fa;
  border-radius: 14px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
}

.payment-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.9rem 0;
  border-bottom: 1px solid #e9ecef;
}

.payment-row:last-child {
  border-bottom: none;
}

.payment-row span {
  color: #666;
}

.payment-amount {
  color: #e74c3c;
  font-size: 1.25rem;
}

.status {
  text-transform: uppercase;
  font-size: 0.85rem;
  padding: 0.35rem 0.7rem;
  border-radius: 20px;
}

.status.pending {
  background: #fff3cd;
  color: #856404;
}

.status.paid {
  background: #d4edda;
  color: #155724;
}

.status.failed {
  background: #f8d7da;
  color: #721c24;
}

/* Flutterwave Loading */
.fw-loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.fw-loading .spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 1rem;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

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

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
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

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.btn-pay {
  width: 100%;
  margin-bottom: 0.75rem;
  background: linear-gradient(135deg, #16a085 0%, #27ae60 100%);
  color: white;
  font-size: 1rem;
}

.btn-pay:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(39, 174, 96, 0.3);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  width: 100%;
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
}

.btn-secondary:hover {
  background: #667eea;
  color: white;
}

.checkout-btn {
  width: 100%;
  margin-bottom: 0.75rem;
}

.error {
  background: #fee;
  color: #e74c3c;
  padding: 0.75rem;
  border-radius: 8px;
  margin: 0 0 1rem;
  font-size: 0.9rem;
}

.success {
  background: #efe;
  color: #27ae60;
  padding: 0.75rem;
  border-radius: 8px;
  margin: 0 0 1rem;
  font-size: 0.9rem;
}

.paid-message {
  background: #d4edda;
  color: #155724;
  padding: 1rem;
  border-radius: 10px;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

/* M-Pesa Polling */
.mpesa-polling {
  text-align: center;
  padding: 2rem;
  background: #f0f7ff;
  border-radius: 12px;
  margin: 1rem 0;
  border: 1px solid #d0e6ff;
}

.mpesa-polling .polling-spinner {
  width: 48px;
  height: 48px;
  margin: 0 auto 1rem;
  border: 4px solid #d0e6ff;
  border-top: 4px solid #0066cc;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.mpesa-polling p {
  color: #0066cc;
  margin: 0.5rem 0;
  font-weight: 500;
}

.mpesa-polling .polling-hint {
  font-size: 0.8rem;
  color: #666;
  font-family: monospace;
  background: #e8f0fe;
  padding: 0.5rem;
  border-radius: 6px;
  margin-top: 1rem;
}

@media (max-width: 800px) {
  .cart-content {
    grid-template-columns: 1fr;
  }

  .cart-summary {
    position: static;
  }

  .cart-item {
    grid-template-columns: 70px 1fr;
    gap: 1rem;
  }

  .item-quantity,
  .item-subtotal,
  .remove-btn {
    grid-column: 2;
  }

  .item-subtotal {
    text-align: left;
  }
}
</style>