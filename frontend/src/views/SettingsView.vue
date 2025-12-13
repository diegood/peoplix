<script setup>
import TechnologyCRUD from '../components/TechnologyCRUD.vue'
import MilestoneTypesCRUD from '../components/MilestoneTypesCRUD.vue'
import CustomFieldManager from '../components/CustomFieldManager.vue'
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Configuración</h1>
      <p class="text-gray-500">Administra los parámetros globales del sistema, tecnologías, tipos de hitos y campos personalizados.</p>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Technologies Section -->
        <div>
            <div class="bg-orange-50/50 p-4 rounded-xl border border-orange-100 mb-6 hidden">
                <h3 class="font-bold text-orange-800">Tecnologías</h3>
            </div>
            <TechnologyCRUD />
        </div>

        <!-- Milestones Section -->
        <div>
             <MilestoneTypesCRUD />
        </div>
        
        <!-- Custom Fields Section -->
        <div class="lg:col-span-2">
            <CustomFieldManager />
        </div>
    </div>
  </div>
</template>
