<template>
  <div class="flex justify-between items-center">
      <div>
          <h1 class="text-3xl font-bold text-gray-900">Estimación de {{ projectName }}</h1>
          <p class="text-gray-500">Gestión de funcionalidades y tiempos</p>
      </div>
  </div>
</template>

<script setup>
defineProps({
  projectName: {
    type: String,
    required: true
  },
  totalHours: {
    type: Number,
    required: true
  }
})
</script>
