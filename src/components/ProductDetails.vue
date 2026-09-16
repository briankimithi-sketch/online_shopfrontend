<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { API_BASE } from '@/config'
import { useCart } from '@/composables/useCart'

const router = useRouter()
const route = useRoute()
const product = ref(null)
const loading = ref(true)
const error = ref('')
const quantity = ref(1)
const cartMessage = ref('')

const { add } = useCart()

const DEMO_PRODUCTS = [
  { id: 1, name: 'Wireless Headphones', price: 4500, category: 'Electronics', image: '/images/4.jpg', description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life. Features premium sound quality, comfortable over-ear design, and Bluetooth 5.0 connectivity.' },
  { id: 2, name: 'Running Shoes', price: 17000, category: 'Sports', image: '/images/11.jpg', description: 'Comfortable running shoes designed for all terrains with superior cushioning. Lightweight mesh upper with responsive midsole for maximum energy return.' },
  { id: 3, name: 'Smart Watch', price: 4800, category: 'Electronics', image: '/images/7.jpg', description: 'Feature-rich smartwatch with health tracking, GPS, and 7-day battery life. Includes heart rate monitor, sleep tracking, and water resistance.' },
  { id: 4, name: 'Backpack', price: 6500, category: 'Clothing', image: '/images/3.jpg', description: 'Durable and stylish backpack perfect for school, work, or travel. Features padded laptop compartment, multiple pockets, and water-resistant material.' },
  { id: 5, name: 'Polarized Sunglasses', price: 11500, category: 'Accessories', image: '/images/10.jpg', description: 'Polarized sunglasses with UV protection and lightweight frame. Perfect for outdoor activities with scratch-resistant lenses.' },
  { id: 6, name: 'Coffee Maker', price: 19000, category: 'Home & Garden', image: '/images/6.jpg', description: 'Programmable coffee maker with built-in grinder for the perfect brew every morning. Makes up to 12 cups with auto-shutoff safety feature.' },
  { id: 7, name: 'Yoga Mat', price: 5000, category: 'Sports', image: '/images/2.jpg', description: 'Non-slip yoga mat with carrying strap for comfortable workouts. Extra thick 6mm cushioning for joint support.' },
  { id: 8, name: 'Leather Wallet', price: 7500, category: 'Accessories', image: '/images/9.jpg', description: 'Genuine leather wallet with RFID blocking technology. Multiple card slots, ID window, and slim profile design.' },
  { id: 9, name: 'Bluetooth Speaker', price: 3500, category: 'Electronics', image: '/images/5.jpg', description: 'Portable Bluetooth speaker with 360-degree sound and waterproof design. 20-hour battery life with built-in microphone for calls.' },
  { id: 10, name: 'Fitness Tracker', price: 4200, category: 'Electronics', image: '/images/1.jpg', description: 'Advanced fitness tracker with heart rate monitor and sleep tracking. Waterproof design with 14-day battery life.' },
  { id: 11, name: 'Wireless Earbuds', price: 3900, category: 'Electronics', image: '/images/8.jpg', description: 'Compact wireless earbuds with premium sound quality and charging case. Active noise cancellation with touch controls.' },
]

onMounted(async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await fetch(`${API_BASE}/products/${route.params.id}`, {
      headers: { 'Accept': 'application/json' },
    })
    if (!response.ok) {
      throw new Error('Product not found')
    }
    const data = await response.json().catch(() => null)
    if (data) {
      product.value = data
    } else {
      product.value = DEMO_PRODUCTS.find(p => p.id == route.params.id) || DEMO_PRODUCTS[0]
    }
  } catch (err) {
    product.value = DEMO_PRODUCTS.find(p => p.id == route.params.id) || DEMO_PRODUCTS[0]
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="product-details-page">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading product...</p>
    </div>

    <p v-else-if="error && !product" class="error">{{ error }}</p>

    <div v-else-if="product" class="product-details">
      <div class="product-image">
        <img v-if="product.image" :src="product.image" :alt="product.name" @error="$event.target.src='https://via.placeholder.com/800x600?text=No+Image'" />
        <div v-else class="placeholder">No Image</div>
      </div>
      <div class="product-info">
        <span class="product-category">{{ product.category }}</span>
        <h1>{{ product.name }}</h1>
        <p class="price">KSh{{ product.price }}</p>
        <div class="divider"></div>
        <p class="description">{{ product.description }}</p>
        <div class="quantity-section">
          <label>Quantity:</label>
          <div class="quantity-controls">
            <button @click="quantity = Math.max(1, quantity - 1)" class="qty-btn">-</button>
            <span>{{ quantity }}</span>
            <button @click="quantity = quantity + 1" class="qty-btn">+</button>
          </div>
        </div>
        <p v-if="cartMessage" class="cart-message">{{ cartMessage }}</p>
        <div class="actions">
          <button class="btn btn-primary" @click="router.push('/products')">Back to Products</button>
          <button class="btn btn-secondary" @click="add(product, quantity); cartMessage = 'Added to cart!'; setTimeout(() => cartMessage = '', 2000)">Add to Cart</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-details-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem;
}
.loading {
  text-align: center;
  margin: 3rem 0;
  color: #666;
}
.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
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
.product-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 10px 40px rgba(0,0,0,0.08);
}
.product-image {
  height: 450px;
  background-color: #f8f9fa;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 16px;
}
.placeholder {
  color: #999;
}
.product-category {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}
.product-info h1 {
  margin: 0.75rem 0;
  font-size: 2rem;
  color: #2c3e50;
}
.price {
  color: #e74c3c;
  font-size: 2rem;
  font-weight: 800;
  margin: 0.5rem 0;
}
.divider {
  height: 1px;
  background: #eee;
  margin: 1.5rem 0;
}
.description {
  line-height: 1.8;
  color: #555;
  margin: 1rem 0;
  font-size: 1.05rem;
}
.actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}
.quantity-section {
  margin: 1rem 0;
  display: flex;
  align-items: center;
  gap: 1rem;
}
.quantity-section label {
  font-weight: 600;
  color: #2c3e50;
}
.quantity-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.qty-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  background: white;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.qty-btn:hover {
  border-color: #667eea;
  color: #667eea;
}
.quantity-controls span {
  font-weight: 700;
  min-width: 24px;
  text-align: center;
  font-size: 1.1rem;
}
.cart-message {
  color: #27ae60;
  font-weight: 600;
  margin: 0.5rem 0 0;
}
.btn {
  padding: 0.9rem 1.5rem;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 600;
  cursor: pointer;
  border: none;
  font-size: 1rem;
  transition: all 0.3s ease;
  flex: 1;
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
