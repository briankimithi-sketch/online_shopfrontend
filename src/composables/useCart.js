import { ref, computed } from 'vue'

const CART_KEY = 'cart'
const items = ref([])

function load() {
  try {
    const raw = localStorage.getItem(CART_KEY)
    items.value = raw ? JSON.parse(raw) : []
  } catch {
    items.value = []
  }
}

function save() {
  localStorage.setItem(CART_KEY, JSON.stringify(items.value))
}

load()

export function useCart() {
  const count = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))
  const total = computed(() => items.value.reduce((sum, item) => sum + item.price * item.quantity, 0))

  function add(product, quantity = 1) {
    const existing = items.value.find(i => i.product_id === product.id)
    if (existing) {
      existing.quantity += quantity
    } else {
      items.value.push({
        product_id: product.id,
        name: product.name,
        price: product.price,
        image: product.image || '',
        quantity,
      })
    }
    save()
  }

  function remove(productId) {
    items.value = items.value.filter(i => i.product_id !== productId)
    save()
  }

  function updateQuantity(productId, quantity) {
    const item = items.value.find(i => i.product_id === productId)
    if (!item) return
    if (quantity <= 0) {
      remove(productId)
      return
    }
    item.quantity = quantity
    save()
  }

  function clear() {
    items.value = []
    save()
  }

  return { items, count, total, add, remove, updateQuantity, clear }
}
