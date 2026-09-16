<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE } from '@/config'

const router = useRouter()
const featuredProducts = ref([])
const categories = ref([
  { name: 'Electronics', icon: '💻', count: 0 },
  { name: 'Clothing', icon: '👕', count: 0 },
  { name: 'Home & Garden', icon: '🏠', count: 0 },
  { name: 'Sports', icon: '⚽', count: 0 },
  { name: 'Accessories', icon: '👜', count: 0 },
])
const loading = ref(true)

const DEMO_PRODUCTS = [
  { id: 1, name: 'Wireless Headphones', price: 4500, category: 'Electronics', image: '/images/4.jpg', description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life. Features premium sound quality, comfortable over-ear design, and Bluetooth 5.0 connectivity.' },
  { id: 2, name: 'Running Shoes', price: 17000, category: 'Sports', image: '/images/11.jpg', description: 'Comfortable running shoes designed for all terrains with superior cushioning. Lightweight mesh upper with responsive midsole for maximum energy return.' },
  { id: 3, name: 'Smart Watch', price: 4800, category: 'Electronics', image: '/images/7.jpg', description: 'Feature-rich smartwatch with health tracking, GPS, and 7-day battery life. Includes heart rate monitor, sleep tracking, and water resistance.' },
  { id: 4, name: 'Backpack', price: 6500, category: 'Clothing', image: '/images/3.jpg', description: 'Durable and stylish backpack perfect for school, work, or travel. Features padded laptop compartment, multiple pockets, and water-resistant material.' },
  { id: 5, name: 'Polarized Sunglasses', price: 11500, category: 'Accessories', image: '/images/10.jpg', description: 'Polarized sunglasses with UV protection and lightweight frame. Perfect for outdoor activities with scratch-resistant lenses.' },
  { id: 6, name: 'Coffee Maker', price: 19000, category: 'Home & Garden', image: '/images/6.jpg', description: 'Programmable coffee maker with built-in grinder for the perfect brew every morning. Makes up to 12 cups with auto-shutoff safety feature.' },
  { id: 7, name: 'Yoga Mat', price: 5000, category: 'Sports', image: '/images/2.jpg', description: 'Non-slip yoga mat with carrying strap for comfortable workouts. Extra thick 6mm cushioning for joint support.' },
  { id: 8, name: 'Leather Wallet', price: 7500, category: 'Accessories', image: '/images/9.jpg', description: 'Genuine leather wallet with RFID blocking technology. Multiple card slots, ID window, and slim profile design.' },
  { id: 9, name: 'Bluetooth Speaker', price: 69.99, category: 'Electronics', image: '/images/5.jpg', description: 'Portable Bluetooth speaker with 360-degree sound and waterproof design. 20-hour battery life with built-in microphone for calls.' },
  { id: 10, name: 'Fitness Tracker', price: 99.99, category: 'Electronics', image: '/images/1.jpg', description: 'Advanced fitness tracker with heart rate monitor and sleep tracking. Waterproof design with 14-day battery life.' },
  { id: 11, name: 'Wireless Earbuds', price: 89.99, category: 'Electronics', image: '/images/8.jpg', description: 'Compact wireless earbuds with premium sound quality and charging case. Active noise cancellation with touch controls.' },
]

async function loadFeatured() {
  loading.value = true
  try {
    const response = await fetch(`${API_BASE}/products`, {
      headers: { 'Accept': 'application/json' },
    })
    if (response.ok) {
      const all = await response.json().catch(() => [])
      if (all.length > 0) {
        featuredProducts.value = all.slice(0, 8)
        updateCategoryCounts(all)
      } else {
        featuredProducts.value = DEMO_PRODUCTS.slice(0, 8)
      }
    } else {
      featuredProducts.value = DEMO_PRODUCTS.slice(0, 8)
    }
  } catch (e) {
    console.error(e)
    featuredProducts.value = DEMO_PRODUCTS.slice(0, 8)
  } finally {
    loading.value = false
  }
}

function updateCategoryCounts(products) {
  categories.value = categories.value.map(cat => ({
    ...cat,
    count: products.filter(p => p.category === cat.name).length,
  }))
}

onMounted(() => {
  loadFeatured()
})
</script>

<template>
  <div class="home-page">
    <section class="hero">
      <div class="hero-content">
        <h1>Welcome to <span class="brand">Online Shop</span></h1>
        <p>Discover amazing products at great prices</p>
        <div class="hero-buttons">
          <button @click="router.push('/products')" class="btn btn-primary">Browse Products</button>
          <button @click="router.push('/signup')" class="btn btn-secondary">Get Started</button>
        </div>
      </div>
    </section>

    <section class="categories">
      <div v-for="cat in categories" :key="cat.name" class="category-card">
        <span class="category-icon">{{ cat.icon }}</span>
        <h3>{{ cat.name }}</h3>
        <p>{{ cat.count }} products</p>
      </div>
    </section>

    <section v-if="!loading && featuredProducts.length" class="featured">
      <h2>Featured Products</h2>
      <div class="featured-grid">
        <div v-for="product in featuredProducts" :key="product.id" class="product-card">
          <div class="product-image">
            <img v-if="product.image" :src="product.image" :alt="product.name" @error="KShevent.target.src='https://via.placeholder.com/400x300?text=No+Image'" />
            <div v-else class="placeholder">No Image</div>
            <span class="product-badge" v-if="product.id <= 3">Hot</span>
            <span class="product-badge new" v-else-if="product.id > 3 && product.id <= 6">New</span>
          </div>
          <div class="product-info">
            <span class="product-category">{{ product.category }}</span>
            <h3>{{ product.name }}</h3>
            <p class="price">KSh{{ product.price }}</p>
            <button class="btn btn-small" @click="$router.push(`/product-details/${product.id}`)">View Details</button>
          </div>
        </div>
      </div>
    </section>

    <section class="features">
      <div class="feature">
        <div class="feature-icon">🚚</div>
        <h3>Fast Delivery</h3>
        <p>Get your orders delivered quickly and safely</p>
      </div>
      <div class="feature">
        <div class="feature-icon">🔒</div>
        <h3>Secure Payments</h3>
        <p>Multiple payment options with secure processing</p>
      </div>
      <div class="feature">
        <div class="feature-icon">💬</div>
        <h3>24/7 Support</h3>
        <p>Our team is here to help you anytime</p>
      </div>
      <div class="feature">
        <div class="feature-icon">↩️</div>
        <h3>Easy Returns</h3>
        <p>30-day return policy on all products</p>
      </div>
    </section>

    <section class="newsletter">
      <div class="newsletter-content">
        <h2>Subscribe to Our Newsletter</h2>
        <p>Get the latest updates on new products and upcoming sales</p>
        <form @submit.prevent class="newsletter-form">
          <input type="email" placeholder="Enter your email" required />
          <button type="submit" class="btn btn-primary">Subscribe</button>
        </form>
      </div>
    </section>

    <footer class="footer">
      <p>&copy; 2026 Online Shop. All rights reserved.</p>
    </footer>
  </div>
</template>

<style scoped>
.home-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}
.hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 5rem 2rem;
  text-align: center;
  border-radius: 0 0 30px 30px;
  margin-bottom: 3rem;
}
.hero-content h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  font-weight: 800;
}
.brand {
  color: #ffd700;
}
.hero-content p {
  font-size: 1.3rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}
.hero-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}
.btn {
  display: inline-block;
  padding: 0.9rem 2rem;
  border-radius: 50px;
  text-decoration: none;
  font-weight: 600;
  cursor: pointer;
  border: none;
  font-size: 1rem;
  transition: all 0.3s ease;
}
.btn-primary {
  background-color: white;
  color: #667eea;
}
.btn-primary:hover {
  background-color: #f0f0f0;
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
}
.btn-secondary {
  background-color: transparent;
  color: white;
  border: 2px solid white;
}
.btn-secondary:hover {
  background-color: white;
  color: #667eea;
  transform: translateY(-2px);
}
.categories {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}
.category-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid #f0f0f0;
}
.category-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.1);
}
.category-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 0.5rem;
}
.category-card h3 {
  margin: 0.5rem 0;
  color: #2c3e50;
}
.category-card p {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
}
.featured {
  margin: 4rem 0;
}
.featured h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: #2c3e50;
  font-size: 2rem;
}
.featured-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 2rem;
}
.product-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;
}
.product-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.12);
}
.product-image {
  height: 220px;
  background-color: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}
.product-card:hover .product-image img {
  transform: scale(1.05);
}
.placeholder {
  color: #999;
  font-size: 0.9rem;
}
.product-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #e74c3c;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}
.product-badge.new {
  background: #2ecc71;
}
.product-info {
  padding: 1.25rem;
}
.product-category {
  display: inline-block;
  background: #f0f0f0;
  color: #666;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-size: 0.75rem;
  margin-bottom: 0.5rem;
}
.product-info h3 {
  margin: 0.5rem 0;
  font-size: 1rem;
  color: #2c3e50;
}
.price {
  color: #e74c3c;
  font-weight: bold;
  font-size: 1.1rem;
  margin: 0;
}
.btn-small {
  width: 100%;
  padding: 0.5rem;
  margin-top: 0.5rem;
  background-color: #2c3e50;
  color: white;
}
.btn-small:hover {
  background-color: #1a252f;
}
.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  padding: 3rem 0;
  margin-bottom: 3rem;
}
.feature {
  text-align: center;
  padding: 2rem;
  border-radius: 16px;
  background: white;
  border: 1px solid #f0f0f0;
  transition: all 0.3s ease;
}
.feature:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.08);
}
.feature-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}
.feature h3 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}
.feature p {
  color: #666;
}
.newsletter {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 20px;
  padding: 3rem;
  text-align: center;
  color: white;
  margin-bottom: 3rem;
}
.newsletter h2 {
  margin-bottom: 0.5rem;
}
.newsletter p {
  opacity: 0.9;
  margin-bottom: 1.5rem;
}
.newsletter-form {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  max-width: 500px;
  margin: 0 auto;
}
.newsletter-form input {
  flex: 1;
  min-width: 200px;
  padding: 0.9rem 1.5rem;
  border: none;
  border-radius: 50px;
  font-size: 1rem;
  outline: none;
}
.newsletter-form .btn-primary {
  background: white;
  color: #f5576c;
}
.footer {
  text-align: center;
  padding: 2rem;
  color: #666;
  border-top: 1px solid #eee;
  margin-top: 2rem;
}
</style>
