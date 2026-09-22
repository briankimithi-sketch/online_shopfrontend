import { ref } from 'vue'
import { API_BASE } from '@/config'
import { useRouter } from 'vue-router'

let flutterwaveLoaded = false

export function useFlutterwave() {
  const router = useRouter()
  const loading = ref(false)
  const error = ref('')

  /**
   * Load Flutterwave inline checkout script
   */
  function loadFlutterwaveScript() {
    return new Promise((resolve, reject) => {
      if (flutterwaveLoaded && window.FlutterwaveCheckout) {
        resolve()
        return
      }

      if (document.getElementById('flutterwave-script')) {
        // Script already loading, wait for it
        const checkLoaded = setInterval(() => {
          if (window.FlutterwaveCheckout) {
            clearInterval(checkLoaded)
            flutterwaveLoaded = true
            resolve()
          }
        }, 100)
        return
      }

      const script = document.createElement('script')
      script.id = 'flutterwave-script'
      script.src = 'https://checkout.flutterwave.com/v3.js'
      script.async = true
      script.onload = () => {
        flutterwaveLoaded = true
        resolve()
      }
      script.onerror = () => {
        reject(new Error('Failed to load Flutterwave SDK'))
      }
      document.head.appendChild(script)
    })
  }

  /**
   * Fetch inline checkout data from backend
   */
  async function getInlineCheckoutData(paymentId) {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      throw new Error('Not authenticated')
    }

    const response = await fetch(`${API_BASE}/payments/${paymentId}/flutterwave/inline-data`, {
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

    return data.flutterwave_data
  }

  /**
   * Open Flutterwave inline checkout modal
   */
  async function openInlineCheckout(paymentId, onSuccess, onClose) {
    loading.value = true
    error.value = ''

    try {
      await loadFlutterwaveScript()

      const checkoutData = await getInlineCheckoutData(paymentId)

      if (!checkoutData) {
        throw new Error('No checkout data received')
      }

      // Configure Flutterwave checkout
      const config = {
        public_key: checkoutData.public_key,
        tx_ref: checkoutData.tx_ref,
        amount: checkoutData.amount,
        currency: checkoutData.currency,
        redirect_url: checkoutData.redirect_url,
        customer: checkoutData.customer,
        customizations: checkoutData.customizations,
        meta: checkoutData.meta,
        payment_options: checkoutData.payment_options,
        callback: function (response) {
          // This is called when the modal closes (success or close)
          // For inline checkout, the actual payment verification happens via redirect/webhook
          console.log('Flutterwave modal closed:', response)
          
          if (response.status === 'successful' || response.status === 'completed') {
            // Payment successful - the backend will handle verification via webhook/callback
            // Redirect to success page with tx_ref
            router.push(`/payment/success?tx_ref=${checkoutData.tx_ref}&status=success`)
          } else if (onClose) {
            onClose()
          }
        },
        onclose: function () {
          // Called when user closes the modal without paying
          if (onClose) onClose()
        },
      }

      // Open the modal
      window.FlutterwaveCheckout(config)

    } catch (err) {
      error.value = err.message || 'Failed to open payment'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Initiate standard redirect checkout (alternative to inline)
   */
  async function initiateRedirectCheckout(paymentId) {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      throw new Error('Not authenticated')
    }

    const response = await fetch(`${API_BASE}/payments/${paymentId}/flutterwave/initiate`, {
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
      throw new Error(data.message || data.error || 'Failed to initiate payment')
    }

    // Redirect to Flutterwave hosted checkout
    if (data.payment_link) {
      window.location.href = data.payment_link
    }

    return data
  }

  return {
    loading,
    error,
    openInlineCheckout,
    initiateRedirectCheckout,
  }
}