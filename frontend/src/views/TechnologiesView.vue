<script setup>
import TechnologyCRUD from '../components/TechnologyCRUD.vue'
</script>

<template>
  <div class="p-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Configuración</h1>
      <p class="text-gray-500">Administra las tecnologías y conocimientos disponibles en el sistema.</p>
    </div>
    
    <div class="max-w-4xl">
        <TechnologyCRUD />
    </div>
  </div>
</template>
