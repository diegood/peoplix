<script setup>
import { ref } from 'vue'
import TechnologyCRUD from '../components/TechnologyCRUD.vue'
import MilestoneManager from '../components/MilestoneManager.vue'
import WorkCenterManager from '../components/WorkCenterManager.vue'
import CustomFieldManager from '../components/CustomFieldManager.vue'
import RoleCRUD from '../components/RoleCRUD.vue'
import { Hexagon } from 'lucide-vue-next'

const showMilestones = ref(false)
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
                <!-- Technologies -->
                <TechnologyCRUD />
            </div>

             <!-- Work Centers -->
             <div class="mb-8">
                <WorkCenterManager />
            </div>

            <!-- Roles & Milestones -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <!-- Roles -->
                <div class="bg-white rounded-lg shadow p-6">
                    <RoleCRUD />
                </div>
                
                <!-- Milestone Types Trigger -->
                <div class="bg-white rounded-lg shadow p-6 flex flex-col items-center justify-center text-center space-y-4">
                    <div class="p-3 bg-indigo-50 text-indigo-600 rounded-full">
                        <Hexagon size="24" />
                    </div>
                    <div>
                        <h3 class="font-bold text-gray-900">Tipos de Hito</h3>
                        <p class="text-sm text-gray-500">Configura los tipos de eventos para el roadmap.</p>
                    </div>
                    <button @click="showMilestones = true" class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
                        Gestionar Hitos
                    </button>
                </div>
            </div>
            
        </div>
        
        <!-- Custom Fields Section -->
        <div class="lg:col-span-2">
            <CustomFieldManager />
        </div>
    </div>

    <!-- Modals -->
    <MilestoneManager v-if="showMilestones" @close="showMilestones = false" />
  </div>
</template>

