<template>
  <div class="flex justify-between items-center">
      <div>
          <h1 class="text-3xl font-bold text-gray-900">Estimación de {{ projectName }}</h1>
          <p class="text-gray-500">Gestión de funcionalidades y tiempos.aa</p>
      </div>
      <div>
          <div class="bg-indigo-50 border border-indigo-100 p-3 rounded-lg text-right">
              <div class="text-xs text-indigo-500 font-bold uppercase">Total Estimado</div>
              <div class="text-2xl font-bold text-indigo-700">{{ totalHours }}h</div>
          </div>
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
