<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="not-found">
    <h1>404</h1>
    <h2>Page Not Found</h2>
    <p>The page you are looking for does not exist.</p>
    <button @click="router.push('/')" class="btn-primary">Go Home</button>
  </div>
</template>

<style scoped>
.not-found {
  text-align: center;
  padding: 4rem 2rem;
}

.not-found h1 {
  font-size: 6rem;
  color: #42b983;
  margin: 0;
}

.not-found h2 {
  font-size: 2rem;
  color: #2c3e50;
  margin: 1rem 0;
}

.not-found p {
  color: #666;
  margin-bottom: 2rem;
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}

.btn-primary:hover {
  background-color: #3aa876;
}

</style>
