<script setup>
import { ref, onMounted, watch } from 'vue'
import { API_BASE } from '@/config'

const products = ref([])
const loading = ref(true)
const error = ref('')
const searchQuery = ref('')
const selectedCategory = ref('all')

const categories = ['all', 'Electronics', 'Clothing', 'Sports', 'Home & Garden', 'Accessories']

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

async function fetchProducts() {
  loading.value = true
  error.value = ''

  try {
    const response = await fetch(`${API_BASE}/products`, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch products')
    }

    const data = await response.json().catch(() => [])
    products.value = data.length > 0 ? data : DEMO_PRODUCTS
  } catch (err) {
    products.value = DEMO_PRODUCTS
  } finally {
    loading.value = false
  }
}

const filteredProducts = ref([])

function applyFilters() {
  filteredProducts.value = products.value.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesCategory = selectedCategory.value === 'all' || product.category === selectedCategory.value
    return matchesSearch && matchesCategory
  })
}

watch([searchQuery, selectedCategory], applyFilters)

onMounted(() => {
  fetchProducts()
})
</script>

<template>
  <div class="products-page">
    <div class="products-banner">
      <div class="banner-content">
        <h1>Our Products</h1>
        <p>Discover amazing products at great prices</p>
      </div>
    </div>

    <div class="products-container">
      <div class="filters">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search products..."
            class="search-input"
          />
        </div>
        <div class="category-filters">
          <button
            v-for="cat in categories"
            :key="cat"
            :class="['filter-btn', { active: selectedCategory === cat }]"
            @click="selectedCategory = cat"
          >
            {{ cat === 'all' ? 'All' : cat }}
          </button>
        </div>
        <div class="results-count">
          Showing {{ filteredProducts.length }} product{{ filteredProducts.length !== 1 ? 's' : '' }}
        </div>
      </div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Loading products...</p>
      </div>

      <div v-else-if="filteredProducts.length === 0" class="empty">
        <div class="empty-icon">🔍</div>
        <h3>No products found</h3>
        <p>Try adjusting your search or filter criteria</p>
      </div>

      <div v-else class="products-grid">
        <div v-for="product in filteredProducts" :key="product.id" class="product-card">
          <div class="product-image">
             <img
               v-if="product.image"
               :src="product.image"
               :alt="product.name"
               @error="$event.target.src='https://via.placeholder.com/400x300?text=No+Image'"
               loading="lazy"
             />
            <div v-else class="placeholder">No Image</div>
            <span class="product-badge" v-if="product.id <= 3">Hot</span>
            <span class="product-badge new" v-else-if="product.id > 3 && product.id <= 6">New</span>
          </div>
          <div class="product-info">
            <span class="product-category">{{ product.category }}</span>
            <h3>{{ product.name }}</h3>
            <p class="price">KSh{{ product.price }}</p>
            <p class="description">{{ product.description }}</p>
            <div class="product-actions">
               <button class="btn btn-primary" @click="$router.push(`/product-details/${product.id}`)">View Details</button>
              <button class="btn btn-icon">♡</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.products-page {
  max-width: 1400px;
  margin: 0 auto;
  min-height: 80vh;
}
.products-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 3rem 2rem;
  text-align: center;
  color: white;
  margin-bottom: 2rem;
}
.banner-content h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  font-weight: 800;
}
.banner-content p {
  font-size: 1.1rem;
  opacity: 0.9;
}
.products-container {
  padding: 0 2rem 2rem;
}
.filters {
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.search-box {
  max-width: 500px;
  margin: 0 auto;
  position: relative;
}
.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.1rem;
}
.search-input {
  width: 100%;
  padding: 0.9rem 1rem 0.9rem 2.8rem;
  border: 2px solid #e0e0e0;
  border-radius: 50px;
  font-size: 1rem;
  outline: none;
  transition: all 0.3s ease;
  background: white;
}
.search-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}
.category-filters {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
}
.filter-btn {
  padding: 0.6rem 1.2rem;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 50px;
  cursor: pointer;
  font-weight: 500;
  color: #666;
  transition: all 0.3s ease;
}
.filter-btn:hover {
  border-color: #667eea;
  color: #667eea;
  transform: translateY(-1px);
}
.filter-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}
.results-count {
  text-align: center;
  color: #666;
  font-size: 0.9rem;
  padding: 0.5rem;
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
.empty {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}
.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}
.empty h3 {
  color: #2c3e50;
  margin: 0 0 0.5rem;
}
.empty p {
  color: #666;
  margin: 0;
}
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 2rem;
}
.product-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
}
.product-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.12);
}
.product-image {
  height: 240px;
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
  transition: transform 0.5s ease;
}
.product-card:hover .product-image img {
  transform: scale(1.08);
}
.placeholder {
  color: #999;
  font-size: 0.9rem;
}
.product-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #e74c3c;
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.product-badge.new {
  background: #2ecc71;
}
.product-info {
  padding: 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.product-category {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.25rem 0.7rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  width: fit-content;
  margin-bottom: 0.75rem;
}
.product-info h3 {
  margin: 0 0 0.5rem;
  font-size: 1.15rem;
  color: #2c3e50;
  font-weight: 700;
}
.price {
  color: #e74c3c;
  font-weight: 800;
  font-size: 1.4rem;
  margin: 0 0 0.75rem;
}
.description {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 1.25rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
  line-height: 1.5;
}
.product-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-top: auto;
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.7rem 1.2rem;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 600;
  cursor: pointer;
  border: none;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  flex: 1;
}
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
}
.btn-icon {
  width: 45px;
  height: 45px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  color: #666;
  border: 1px solid #e0e0e0;
  font-size: 1.2rem;
  flex: none;
  border-radius: 10px;
}
.btn-icon:hover {
  background: #ffeef0;
  color: #e74c3c;
  border-color: #e74c3c;
  transform: translateY(-2px);
}
</style>
