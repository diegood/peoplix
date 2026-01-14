<template>
  <div class="unauthorized-container">
    <div class="content">
      <h1>401 - Acceso denegado</h1>
      <p>No tienes permiso para acceder al dashboard de esta organización.</p>
      <button @click="goHome" class="home-btn">Volver al inicio</button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/login')
}
</script>

<style scoped>
.unauthorized-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f8f9fa;
  color: #333;
}

.content {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

h1 {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #e74c3c;
}

p {
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.home-btn {
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  color: white;
  background-color: #3498db;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.home-btn:hover {
  background-color: #2980b9;
}
</style>
