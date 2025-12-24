<script setup>
import { computed } from 'vue'
import { Radar } from 'vue-chartjs'
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

const props = defineProps({
  currentSkills: { type: Array, default: () => [] },
  projectSkills: { type: Array, default: () => [] }
})

const chartData = computed(() => {
  const projectSkillMap = new Map()
  props.projectSkills.forEach(s => projectSkillMap.set(s.id, s.name))
  
  if (projectSkillMap.size === 0) return { labels: [], datasets: [] }

  const labels = Array.from(projectSkillMap.values())
  const skillIds = Array.from(projectSkillMap.keys())

  const currentSkillLevelMap = new Map()
  props.currentSkills.forEach(cs => {
      if (cs.skill) {
          currentSkillLevelMap.set(cs.skill.id, cs.level)
      }
  })

  const dataValues = skillIds.map(id => currentSkillLevelMap.get(id) || 0)

  return {
    labels,
    datasets: [
      {
        label: 'Nivel Actual',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
        data: dataValues
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    r: {
      angleLines: {
        display: true,
        color: 'rgba(0,0,0,0.05)'
      },
      grid: {
         color: 'rgba(0,0,0,0.05)'
      },
      pointLabels: {
          font: {
              size: 11,
              family: 'Inter, system-ui, sans-serif'
          },
          color: '#4B5563'
      },
      suggestedMin: 0,
      suggestedMax: 4,
      ticks: {
          stepSize: 1,
          display: false 
      }
    }
  },
  plugins: {
      legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
              usePointStyle: true,
              boxWidth: 8
          }
      }
  }
}
</script>

<template>
  <div class="h-[200px] w-full">
    <Radar :data="chartData" :options="chartOptions" />
    <div v-if="projectSkills.length === 0" class="flex items-center justify-center h-full text-gray-400 text-sm absolute inset-0">
        No hay datos de proyectos para mostrar.
    </div>
  </div>
</template>
