<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE } from '@/config'

const router = useRouter()
const users = ref([])
const products = ref([])
const orders = ref([])
const roles = ref([])
const loading = ref(true)
const error = ref('')
const activeTab = ref('users')
const searchQuery = ref('')
const selectedUser = ref(null)
const productFormOpen = ref(false)
const editingProduct = ref(null)
const productForm = ref({ name: '', price: '', category: '', image: '', description: '' })
const roleFormOpen = ref(false)
const newRoleName = ref('')
const saving = ref(false)
const actionError = ref('')

const filteredUsers = computed(() => users.value.filter(user => {
  const query = searchQuery.value.toLowerCase()
  return !query || [user.name, user.email, getRoleName(user.role_id)].some(value => String(value || '').toLowerCase().includes(query))
}))
const filteredProducts = computed(() => products.value.filter(product => {
  const query = searchQuery.value.toLowerCase()
  return !query || [product.name, product.category, product.description].some(value => String(value || '').toLowerCase().includes(query))
}))
const filteredOrders = computed(() => orders.value.filter(order => {
  const query = searchQuery.value.toLowerCase()
  return !query || [order.id, getUserName(order.user_id), order.product?.name, order.status, order.payment_status].some(value => String(value || '').toLowerCase().includes(query))
}))
const totalSales = computed(() => orders.value.reduce((sum, order) => sum + orderTotal(order), 0))
const paidSales = computed(() => orders.value.filter(order => ['paid', 'completed'].includes(String(order.payment_status || '').toLowerCase())).reduce((sum, order) => sum + orderTotal(order), 0))
const pendingOrders = computed(() => orders.value.filter(order => !['delivered', 'cancelled', 'completed'].includes(String(order.status || 'placed').toLowerCase())).length)
const orderStatuses = ['placed', 'processing', 'shipped', 'delivered', 'cancelled']
const paymentStatuses = ['pending', 'paid', 'failed', 'refunded']

onMounted(() => {
  const token = localStorage.getItem('token')
  if (!token) {
    router.push('/login')
    return
  }
  fetchData()
})

async function fetchData() {
  loading.value = true
  error.value = ''
  const token = localStorage.getItem('token')
  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
  }

  try {
    const [usersRes, productsRes, ordersRes, rolesRes] = await Promise.all([
      fetch(`${API_BASE}/users`, { headers }),
      fetch(`${API_BASE}/products`, { headers }),
      fetch(`${API_BASE}/orders`, { headers }),
      fetch(`${API_BASE}/roles`, { headers }),
    ])

    if (!usersRes.ok || !productsRes.ok || !ordersRes.ok || !rolesRes.ok) {
      throw new Error('Some dashboard data could not be loaded.')
    }

    users.value = await usersRes.json().catch(() => [])
    products.value = await productsRes.json().catch(() => [])
    orders.value = await ordersRes.json().catch(() => [])
    roles.value = await rolesRes.json().catch(() => [])
  } catch (err) {
    console.error(err)
    error.value = 'We could not load the dashboard data. Please try again.'
  } finally {
    loading.value = false
  }
}

function authHeaders(json = false) {
  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
  }
  if (json) headers['Content-Type'] = 'application/json'
  return headers
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers: { ...authHeaders(Boolean(options.body)), ...(options.headers || {}) } })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || data.error || `Request failed (${response.status})`)
  return data
}

async function saveProduct() {
  saving.value = true
  actionError.value = ''
  try {
    const payload = { ...productForm.value, price: Number(productForm.value.price) }
    const data = await request(editingProduct.value ? `/products/${editingProduct.value.id}` : '/products', {
      method: editingProduct.value ? 'PUT' : 'POST', body: JSON.stringify(payload),
    })
    const saved = data.product || data
    if (editingProduct.value) products.value = products.value.map(product => product.id === saved.id ? saved : product)
    else products.value.unshift(saved)
    closeProductForm()
  } catch (err) { actionError.value = err.message } finally { saving.value = false }
}

async function deleteProduct(product) {
  if (!window.confirm(`Delete ${product.name}?`)) return
  try {
    await request(`/products/${product.id}`, { method: 'DELETE' })
    products.value = products.value.filter(item => item.id !== product.id)
  } catch (err) { actionError.value = err.message }
}

function openProductForm(product = null) {
  editingProduct.value = product
  productForm.value = product ? { name: product.name || '', price: product.price || '', category: product.category || '', image: product.image || '', description: product.description || '' } : { name: '', price: '', category: '', image: '', description: '' }
  productFormOpen.value = true
  actionError.value = ''
}

function closeProductForm() { productFormOpen.value = false; editingProduct.value = null }

async function createRole() {
  if (!newRoleName.value.trim()) return
  saving.value = true
  actionError.value = ''
  try {
    const data = await request('/roles', { method: 'POST', body: JSON.stringify({ name: newRoleName.value.trim() }) })
    roles.value.push(data.role || data)
    newRoleName.value = ''
    roleFormOpen.value = false
  } catch (err) { actionError.value = err.message } finally { saving.value = false }
}

async function deleteRole(role) {
  if (!window.confirm(`Delete the ${role.name} role?`)) return
  try {
    await request(`/roles/${role.id}`, { method: 'DELETE' })
    roles.value = roles.value.filter(item => item.id !== role.id)
  } catch (err) { actionError.value = err.message }
}

async function assignRole(user, roleId) {
  try {
    const data = await request(`/users/${user.id}`, { method: 'PATCH', body: JSON.stringify({ role_id: Number(roleId) }) })
    const updated = data.user || { ...user, role_id: Number(roleId) }
    users.value = users.value.map(item => item.id === user.id ? updated : item)
  } catch (err) { actionError.value = err.message; await fetchData() }
}

async function updateOrder(order, field, value) {
  try {
    const data = await request(`/orders/${order.id}`, { method: 'PATCH', body: JSON.stringify({ [field]: value }) })
    const updated = data.order || { ...order, [field]: value }
    orders.value = orders.value.map(item => item.id === order.id ? updated : item)
  } catch (err) { actionError.value = err.message }
}

function getRoleName(roleId) {
  const role = roles.value.find(r => r.id === roleId)
  return role ? role.name : `Role ${roleId}`
}

function getUserName(userId) {
  const user = users.value.find(u => u.id === userId)
  return user ? user.name : `User #${userId}`
}

function orderTotal(order) { return Number(order.total || order.product?.price || 0) * Number(order.total ? 1 : order.quantity || 0) }
</script>

<template>
  <div class="admin-page">
    <div class="page-header">
      <div>
        <p class="eyebrow">Store operations</p>
        <h1>Admin Dashboard</h1>
        <p>Keep an eye on your shop and its customers.</p>
      </div>
      <button class="refresh-btn" type="button" :disabled="loading" @click="fetchData">
        {{ loading ? 'Refreshing...' : 'Refresh data' }}
      </button>
    </div>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-info">
          <h3>{{ users.length }}</h3>
          <p>Users</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-info">
          <h3>{{ products.length }}</h3>
          <p>Products</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🛒</div>
        <div class="stat-info">
          <h3>{{ orders.length }}</h3>
          <p>Orders</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔑</div>
        <div class="stat-info">
          <h3>{{ roles.length }}</h3>
          <p>Roles</p>
        </div>
      </div>
      <div class="stat-card stat-card-accent">
        <div class="stat-icon">💰</div>
        <div class="stat-info">
          <h3>KSh{{ totalSales.toLocaleString() }}</h3>
          <p>Total sales</p>
        </div>
      </div>
      <div class="stat-card stat-card-accent">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <h3>KSh{{ paidSales.toLocaleString() }}</h3>
          <p>Paid revenue</p>
        </div>
      </div>
      <div class="stat-card stat-card-warning">
        <div class="stat-icon">⏳</div>
        <div class="stat-info">
          <h3>{{ pendingOrders }}</h3>
          <p>Open orders</p>
        </div>
      </div>
    </div>

    <div class="tabs">
      <button :class="{ active: activeTab === 'users' }" @click="activeTab = 'users'">Users</button>
      <button :class="{ active: activeTab === 'products' }" @click="activeTab = 'products'">Products</button>
      <button :class="{ active: activeTab === 'orders' }" @click="activeTab = 'orders'">Orders</button>
      <button :class="{ active: activeTab === 'roles' }" @click="activeTab = 'roles'">Roles</button>
    </div>

    <div class="toolbar">
      <input v-model="searchQuery" type="search" placeholder="Search this section..." aria-label="Search dashboard" />
      <button v-if="activeTab === 'products'" class="toolbar-btn" type="button" @click="openProductForm()">+ Add product</button>
      <button v-if="activeTab === 'roles'" class="toolbar-btn" type="button" @click="roleFormOpen = !roleFormOpen">+ Create role</button>
    </div>
    <p v-if="actionError" class="action-error">{{ actionError }}</p>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading dashboard data...</p>
    </div>

    <div v-else-if="error" class="status-panel error-panel">
      <strong>Dashboard unavailable</strong>
      <p>{{ error }}</p>
      <button type="button" @click="fetchData">Try again</button>
    </div>

    <div v-else class="admin-content">
      <div v-if="activeTab === 'users'" class="tab-content">
        <div class="data-list">
          <div v-for="user in filteredUsers" :key="user.id" class="data-card">
            <div class="data-header">
              <div class="data-avatar">{{ user.name?.charAt(0)?.toUpperCase() }}</div>
              <div class="data-title">
                <h4>{{ user.name }}</h4>
                <p>{{ user.email }}</p>
              </div>
            </div>
            <div class="data-body">
              <span class="data-tag">{{ getRoleName(user.role_id) }}</span>
              <span class="data-tag" v-if="user.phone">{{ user.phone }}</span>
            </div>
            <div class="card-actions">
              <button type="button" class="text-btn" @click="selectedUser = user">View details</button>
              <select :value="user.role_id" aria-label="Assign role" @change="assignRole(user, $event.target.value)">
                <option v-for="role in roles" :key="role.id" :value="role.id">{{ role.name }}</option>
              </select>
            </div>
          </div>
          <div v-if="filteredUsers.length === 0" class="status-panel">
            <strong>No users yet</strong>
            <p>New customer accounts will appear here.</p>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'products'" class="tab-content">
        <div class="data-list">
          <div v-for="product in filteredProducts" :key="product.id" class="data-card">
            <div class="data-header">
              <div class="data-icon">📦</div>
              <div class="data-title">
                <h4>{{ product.name }}</h4>
                <p>{{ product.category }}</p>
              </div>
            </div>
            <div class="data-body">
              <span class="data-price">KSh{{ product.price }}</span>
            </div>
            <p class="data-description">{{ product.description }}</p>
            <div class="card-actions">
              <button type="button" class="text-btn" @click="openProductForm(product)">Edit</button>
              <button type="button" class="danger-btn" @click="deleteProduct(product)">Delete</button>
            </div>
          </div>
          <div v-if="filteredProducts.length === 0" class="status-panel">
            <strong>No products yet</strong>
            <p>Add products from your store management tools.</p>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'orders'" class="tab-content">
        <div class="data-list">
          <div v-for="order in filteredOrders" :key="order.id" class="data-card">
            <div class="data-header">
              <div class="data-icon">🛒</div>
              <div class="data-title">
                <h4>Order #{{ order.id }}</h4>
                <p>{{ order.product?.name || `Product #${order.product_id}` }}</p>
              </div>
            </div>
            <div class="data-body">
              <span class="data-tag">Qty: {{ order.quantity }}</span>
              <span class="data-tag">{{ getUserName(order.user_id) }}</span>
              <span class="data-price">KSh{{ orderTotal(order).toLocaleString() }}</span>
            </div>
            <div class="order-controls">
              <label>Status <select :value="order.status || 'placed'" @change="updateOrder(order, 'status', $event.target.value)"><option v-for="status in orderStatuses" :key="status">{{ status }}</option></select></label>
              <label>Payment <select :value="order.payment_status || 'pending'" @change="updateOrder(order, 'payment_status', $event.target.value)"><option v-for="status in paymentStatuses" :key="status">{{ status }}</option></select></label>
            </div>
          </div>
          <div v-if="filteredOrders.length === 0" class="status-panel">
            <strong>No orders yet</strong>
            <p>Orders will appear here as customers check out.</p>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'roles'" class="tab-content">
        <form v-if="roleFormOpen" class="inline-form" @submit.prevent="createRole">
          <input v-model="newRoleName" placeholder="Role name, e.g. Manager" required />
          <button class="toolbar-btn" type="submit" :disabled="saving">Create</button>
        </form>
        <div class="data-list">
          <div v-for="role in roles" :key="role.id" class="data-card">
            <div class="data-header">
              <div class="data-icon">🔑</div>
              <div class="data-title">
                <h4>{{ role.name }}</h4>
                <p>{{ role.users_count }} user{{ role.users_count !== 1 ? 's' : '' }}</p>
              </div>
            </div>
            <button type="button" class="danger-btn" @click="deleteRole(role)">Delete role</button>
          </div>
          <div v-if="roles.length === 0" class="status-panel">
            <strong>No roles found</strong>
            <p>Available roles will appear here.</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedUser" class="modal-backdrop" @click.self="selectedUser = null">
      <section class="modal-card">
        <button class="modal-close" type="button" aria-label="Close" @click="selectedUser = null">×</button>
        <p class="eyebrow">Customer details</p>
        <h2>{{ selectedUser.name }}</h2>
        <div class="detail-grid">
          <span>Email</span><strong>{{ selectedUser.email }}</strong>
          <span>Phone</span><strong>{{ selectedUser.phone || 'Not provided' }}</strong>
          <span>Address</span><strong>{{ selectedUser.delivery_address || 'Not provided' }}</strong>
          <span>Role</span><strong>{{ getRoleName(selectedUser.role_id) }}</strong>
        </div>
      </section>
    </div>

    <div v-if="productFormOpen" class="modal-backdrop" @click.self="closeProductForm">
      <form class="modal-card form-card" @submit.prevent="saveProduct">
        <button class="modal-close" type="button" aria-label="Close" @click="closeProductForm">×</button>
        <p class="eyebrow">Catalog management</p>
        <h2>{{ editingProduct ? 'Edit product' : 'Add product' }}</h2>
        <label>Name<input v-model="productForm.name" required /></label>
        <div class="form-row"><label>Price<input v-model="productForm.price" type="number" min="0" required /></label><label>Category<input v-model="productForm.category" required /></label></div>
        <label>Image URL<input v-model="productForm.image" /></label>
        <label>Description<textarea v-model="productForm.description" rows="3"></textarea></label>
        <button class="toolbar-btn" type="submit" :disabled="saving">{{ saving ? 'Saving...' : 'Save product' }}</button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.admin-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 2rem;
  gap: 1rem;
}
.eyebrow {
  color: #667eea;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  margin: 0 0 0.5rem;
  text-transform: uppercase;
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
.refresh-btn,
.status-panel button {
  background: #2c3e50;
  border: 0;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0.7rem 1rem;
  transition: background 0.2s ease, transform 0.2s ease;
}
.refresh-btn:hover:not(:disabled),
.status-panel button:hover {
  background: #1f2d3a;
  transform: translateY(-1px);
}
.refresh-btn:disabled {
  cursor: wait;
  opacity: 0.65;
}
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}
.stat-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}
.stat-card-accent { border-left: 4px solid #667eea; }
.stat-card-warning { border-left: 4px solid #f39c12; }
.stat-icon {
  font-size: 2.5rem;
}
.stat-info h3 {
  margin: 0;
  font-size: 1.8rem;
  color: #2c3e50;
}
.stat-info p {
  margin: 0.25rem 0 0;
  color: #666;
  font-size: 0.9rem;
}
.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  background: white;
  padding: 0.5rem;
  border-radius: 12px;
  width: fit-content;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.tabs button {
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  color: #666;
  border-radius: 8px;
  transition: all 0.3s ease;
}
.tabs button:hover {
  color: #667eea;
}
.tabs button.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin: 0 0 1.5rem;
}
.toolbar input,
.toolbar select,
.inline-form input,
.form-card input,
.form-card textarea,
.card-actions select,
.order-controls select {
  border: 1px solid #dfe3eb;
  border-radius: 8px;
  background: white;
  color: #2c3e50;
  font: inherit;
  padding: 0.65rem 0.8rem;
}
.toolbar input { flex: 1; max-width: 420px; }
.toolbar-btn {
  background: #667eea;
  border: 0;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  font-weight: 700;
  padding: 0.7rem 1rem;
}
.toolbar-btn:disabled { cursor: wait; opacity: 0.6; }
.action-error {
  background: #fff1f0;
  border: 1px solid #f1b7b2;
  border-radius: 8px;
  color: #b42318;
  margin: -0.5rem 0 1.5rem;
  padding: 0.75rem 1rem;
}
.loading {
  text-align: center;
  margin: 3rem 0;
  color: #667;
}
.loading p {
  margin-top: 1rem;
}
.spinner {
  width: 50px;
  height: 50px;
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
.data-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}
.data-card {
  background: white;
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  border: 1px solid #f0f0f0;
  transition: all 0.3s ease;
}
.data-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.08);
}
.data-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}
.data-avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.2rem;
}
.data-icon {
  font-size: 2rem;
}
.data-title h4 {
  margin: 0;
  color: #2c3e50;
  font-size: 1rem;
}
.data-title p {
  margin: 0.25rem 0 0;
  color: #666;
  font-size: 0.85rem;
}
.data-body {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.data-tag {
  background: #f0f0f0;
  color: #666;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
}
.data-price {
  color: #e74c3c;
  font-weight: 700;
  font-size: 1.1rem;
}
.data-description {
  color: #666;
  font-size: 0.85rem;
  margin-top: 0.75rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.card-actions,
.order-controls {
  align-items: center;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 0.6rem;
  justify-content: space-between;
  margin-top: 1rem;
  padding-top: 1rem;
}
.card-actions select { max-width: 130px; }
.text-btn,
.danger-btn {
  background: transparent;
  border: 0;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  padding: 0.35rem 0;
}
.text-btn { color: #667eea; }
.danger-btn { color: #d64545; }
.order-controls { align-items: stretch; flex-direction: column; }
.order-controls label { color: #667085; display: flex; font-size: 0.8rem; justify-content: space-between; gap: 1rem; }
.order-controls select { padding: 0.4rem 0.6rem; }
.inline-form {
  align-items: center;
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}
.inline-form input { flex: 1; }
.modal-backdrop {
  align-items: center;
  background: rgba(28, 36, 48, 0.55);
  display: flex;
  inset: 0;
  justify-content: center;
  padding: 1rem;
  position: fixed;
  z-index: 200;
}
.modal-card {
  background: white;
  border-radius: 14px;
  box-shadow: 0 20px 70px rgba(0,0,0,0.2);
  max-width: 480px;
  padding: 2rem;
  position: relative;
  width: 100%;
}
.modal-card h2 { color: #2c3e50; margin: 0 0 1.25rem; }
.modal-close { background: transparent; border: 0; color: #667085; cursor: pointer; font-size: 1.6rem; line-height: 1; position: absolute; right: 1rem; top: 1rem; }
.detail-grid { display: grid; gap: 0.7rem; grid-template-columns: 100px 1fr; }
.detail-grid span { color: #667085; }
.detail-grid strong { color: #2c3e50; overflow-wrap: anywhere; }
.form-card { display: flex; flex-direction: column; gap: 0.8rem; }
.form-card label { color: #475467; display: flex; flex-direction: column; font-size: 0.85rem; font-weight: 600; gap: 0.35rem; }
.form-card .form-row { display: grid; gap: 0.8rem; grid-template-columns: 1fr 1fr; }
.form-card textarea { resize: vertical; }
.status-panel {
  background: white;
  border: 1px dashed #d8dce8;
  border-radius: 12px;
  color: #667085;
  grid-column: 1 / -1;
  padding: 2rem;
  text-align: center;
}
.status-panel strong {
  color: #2c3e50;
  display: block;
  font-size: 1.05rem;
  margin-bottom: 0.4rem;
}
.status-panel p {
  margin: 0 0 1rem;
}
.error-panel {
  border-color: #f1b7b2;
}

@media (max-width: 640px) {
  .admin-page {
    padding: 1.25rem;
  }
  .page-header {
    align-items: stretch;
    flex-direction: column;
  }
  .refresh-btn {
    width: 100%;
  }
  .stats {
    gap: 0.75rem;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .stat-card {
    gap: 0.65rem;
    padding: 1rem;
  }
  .stat-icon {
    font-size: 1.7rem;
  }
  .stat-info h3 {
    font-size: 1.4rem;
  }
  .tabs {
    overflow-x: auto;
    width: 100%;
  }
  .tabs button {
    flex: 0 0 auto;
    padding: 0.7rem 1rem;
  }
  .data-list {
    grid-template-columns: 1fr;
  }
  .toolbar { align-items: stretch; flex-direction: column; }
  .toolbar input { max-width: none; }
  .toolbar-btn { width: 100%; }
  .form-card .form-row { grid-template-columns: 1fr; }
}
</style>
