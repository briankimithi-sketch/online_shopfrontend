import { createRouter, createWebHistory } from 'vue-router'

import Home from '@/components/Home.vue'
import Login from '@/components/Login.vue'
import SignUp from '@/components/SignUp.vue'
import Profile from '@/components/Profile.vue'
import Admin from '@/components/Admin.vue'
import Orders from '@/components/Orders.vue'
import Products from '@/components/Products.vue'
import ProductDetails from '@/components/ProductDetails.vue'
import Cart from '@/components/Cart.vue'
import NotFound from '@/components/NotFound.vue'
import PaymentSuccess from '@/components/PaymentSuccess.vue'
import PaymentCancel from '@/components/PaymentCancel.vue'

function requireAuth() {
  const token = localStorage.getItem('token')
  return token ? true : '/login'
}

function requireAdmin() {
  if (!localStorage.getItem('token')) return '/login'
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  return Number(user.role_id) === 1 ? true : '/'
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
    {
      path: '/signup',
      name: 'signup',
      component: SignUp,
    },
    {
      path: '/profile',
      name: 'profile',
      component: Profile,
      beforeEnter: requireAuth,
    },
    {
      path: '/admin',
      name: 'admin',
      component: Admin,
      beforeEnter: requireAdmin,
    },
    {
      path: '/products',
      name: 'products',
      component: Products,
    },
    {
      path: '/orders',
      name: 'orders',
      component: Orders,
      beforeEnter: requireAuth,
    },
    {
      path: '/cart',
      name: 'cart',
      component: Cart,
      beforeEnter: requireAuth,
    },
    {
      path: '/product-details/:id',
      name: 'product-details',
      component: ProductDetails,
    },
    {
      path: '/payment/success',
      name: 'payment-success',
      component: PaymentSuccess,
    },
    {
      path: '/payment/cancel',
      name: 'payment-cancel',
      component: PaymentCancel,
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFound,
    },
  ],
})

export default router
