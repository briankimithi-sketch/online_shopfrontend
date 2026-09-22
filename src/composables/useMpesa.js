import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE } from '@/config'

export function useMpesa() {
  const router = useRouter()
  const loading = ref(false)
  const error = ref('')
  const stkPushed = ref(false)
  const checkoutRequestId = ref(null)
  const polling = ref(false)

  /**
   * Initiate STK Push
   */
  async function initiateStkPush(paymentId) {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      throw new Error('Not authenticated')
    }

    loading.value = true
    error.value = ''
    stkPushed.value = false
    checkoutRequestId.value = null

    try {
      const response = await fetch(`${API_BASE}/payments/${paymentId}/mpesa/stk-push`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/login')
          throw new Error('Session expired')
        }
        throw new Error(data.message || data.error || 'Failed to initiate STK Push')
      }

      stkPushed.value = true
      checkoutRequestId.value = data.checkout_request_id

      return {
        success: true,
        checkoutRequestId: data.checkout_request_id,
        merchantRequestId: data.merchant_request_id,
        customerMessage: data.customer_message,
      }
    } catch (err) {
      error.value = err.message || 'Failed to initiate payment'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Query STK Push status
   */
  async function queryStkPush(paymentId) {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      throw new Error('Not authenticated')
    }

    try {
      const response = await fetch(`${API_BASE}/payments/${paymentId}/mpesa/query`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/login')
          throw new Error('Session expired')
        }
        throw new Error(data.message || data.error || 'Failed to query payment status')
      }

      return data
    } catch (err) {
      throw err
    }
  }

  /**
   * Poll STK Push status until completion
   */
  async function pollStkPush(paymentId, onSuccess, onError, interval = 3000, maxAttempts = 60) {
    polling.value = true
    let attempts = 0

    const poll = async () => {
      if (attempts >= maxAttempts) {
        polling.value = false
        onError?.(new Error('Payment timed out. Please check your phone or try again.'))
        return
      }

      try {
        const result = await queryStkPush(paymentId)

        if (result.is_completed) {
          polling.value = false
          onSuccess?.(result)
          return
        }

        if (result.is_failed) {
          polling.value = false
          onError?.(new Error(result.result_desc || 'Payment failed'))
          return
        }

        // Still pending, continue polling
        attempts++
        setTimeout(poll, interval)
      } catch (err) {
        // Don't stop polling on network errors, just retry
        attempts++
        setTimeout(poll, interval)
      }
    }

    await poll()
  }

  /**
   * Stop polling
   */
  function stopPolling() {
    polling.value = false
  }

  /**
   * Get inline checkout data (phone, amount, etc.)
   */
  async function getInlineData(paymentId) {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      throw new Error('Not authenticated')
    }

    const response = await fetch(`${API_BASE}/payments/${paymentId}/mpesa/inline-data`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
        throw new Error('Session expired')
      }
      throw new Error(data.message || data.error || 'Failed to get payment data')
    }

    return data.mpesa_data
  }

  return {
    loading,
    error,
    stkPushed,
    checkoutRequestId,
    polling,
    initiateStkPush,
    queryStkPush,
    pollStkPush,
    stopPolling,
    getInlineData,
  }
}