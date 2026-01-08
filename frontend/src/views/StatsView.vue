<script setup>
import { computed } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { GET_COLLABORATORS } from '@/graphql/queries'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'

const RED = '#f87171', GREEN = '#4ade80';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const { result, loading, error } = useQuery(GET_COLLABORATORS)

const loadData = computed(() => {
  if (!result.value?.collaborators) return []
  return result.value.collaborators.map(c => {
    const allocated = c.allocations?.Reduce((acc, a) => acc + a.hours, 0) || 0
    return {
      name: c.firstName,
      contracted: c.contractedHours,
      allocated: allocated,
      diff: c.contractedHours - allocated,
      status: allocated > c.contractedHours ? 'Overloaded' : (allocated < c.contractedHours ? 'Underutilized' : 'Optimal')
    }
  })
})

const chartData = computed(() => {
  return {
    labels: loadData.value.map(d => d.name),
    datasets: [
      {
        label: 'Horas Contratadas',
        backgroundColor: '#93c5fd',
        data: loadData.value.map(d => d.contracted)
      },
      {
        label: 'Horas Asignadas',
        backgroundColor: (ctx) => {
            const index = ctx.dataIndex;
            const item = loadData.value[index];
            return item && item.allocated > item.contracted ? RED : GREEN;
        },
        data: loadData.value.map(d => d.allocated)
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false
}
</script>

<template>
  <div class="h-full p-8 flex flex-col">
    <h1 class="text-3xl font-bold mb-8 text-gray-900">Estadísticas de Capacidad</h1>

    <div v-if="loading">Cargando estadísticas...</div>
    <div v-else-if="error" class="text-red-500">{{ error.message }}</div>

    <div v-else class="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-hidden">
       <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <h3 class="font-bold text-gray-700 mb-4">Distribución de Carga de Trabajo</h3>
          <div class="flex-1 min-h-[300px]">
            <Bar :data="chartData" :options="chartOptions" />
          </div>
       </div>

       <div class="space-y-6 overflow-auto">
          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <h3 class="font-bold text-gray-700 mb-4">Requieren Atención</h3>
             <ul class="space-y-3">
               <li v-for="item in loadData.filter(d => d.status !== 'Optimal').sort((a,b) => a.diff - b.diff)" :key="item.name" 
                   class="flex items-center justify-between p-2 rounded bg-gray-50">
                 <div class="font-medium text-sm">{{ item.name }}</div>
                 <div class="text-xs font-bold px-2 py-1 rounded" 
                      :class="item.status === 'Overloaded' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'">
                   {{ item.status === 'Overloaded' ? '+' + Math.abs(item.diff) + 'h Exceso' : Math.abs(item.diff) + 'h Libre' }}
                 </div>
               </li>
               <li v-if="!loadData.some(d => d.status !== 'Optimal')" class="text-green-600 text-sm italic">
                  ¡Toda la carga de trabajo está balanceada!
               </li>
             </ul>
          </div>
       </div>
    </div>
  </div>
</template>
