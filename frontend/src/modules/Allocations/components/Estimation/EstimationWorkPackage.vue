<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <!-- Header -->
      <div class="p-4 bg-gray-50 flex justify-between items-center cursor-pointer" @click="toggleExpand">
          <div class="flex items-center gap-3">
              <button class="text-gray-400">
                  <ChevronDown v-if="isExpanded" size="20"/>
                  <ChevronRight v-else size="20" />
              </button>
              <div>
                  <h4 class="font-bold text-gray-800">{{ wp.name }}</h4>
                  <span class="text-xs text-gray-500" v-if="wp.highLevelEstimation">Estimación Alta: {{ wp.highLevelEstimation }}h</span>
                  <span class="text-gray-300 mx-2">|</span>
                  <input type="date" 
                         :value="formatDate(wp.startDate)" 
                         @change="onStartDateChange"
                         @click.stop
                         class="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
              </div>
          </div>
          <div class="flex items-center gap-4">
               <div class="text-sm font-medium text-gray-600">
                   {{ wp.tasks?.reduce((acc, t) => acc + (t.estimations?.reduce((a,e)=>a+e.hours,0) || 0), 0) }}h
               </div>
              <button @click.stop="$emit('delete', wp.id)" class="text-red-400 hover:text-red-600">
                  <Trash size="18" />
              </button>
          </div>
      </div>

      <div v-show="isExpanded" class="p-4 border-t border-gray-100">
          <table class="w-full text-sm">
              <thead>
                  <tr class="text-left text-gray-500 border-b">
                       <th class="pb-2 pl-2">Tarea</th>
                       <th v-for="role in roleColumns" :key="role.id" class="pb-2 w-24 text-center">{{ role.name }} (h)</th>
                       <th class="pb-2 w-48 text-center">Dependencias</th>
                       <th class="pb-2 w-10"></th>
                  </tr>
              </thead>
              <tbody>
                  <tr v-for="task in wp.tasks" :key="task.id" class="border-b border-gray-50 hover:bg-gray-50">
                       <td class="py-2 pl-2 font-medium">
                           <input :value="task.name" 
                                  class="w-full bg-transparent border-none outline-none focus:ring-0 font-medium text-gray-700"
                                  @change="(e) => $emit('update-task-name', task.id, e.target.value)" />
                       </td>
                       <td v-for="role in roleColumns" :key="role.id" class="py-2 text-center">
                           <input 
                               type="number" 
                               min="0"
                               class="w-16 border rounded px-1 py-0.5 text-center focus:border-blue-500 outline-none"
                               :value="task.estimations.find(e => e.role.id === role.id)?.hours || 0"
                               @change="(e) => $emit('update-est', task.id, role.id, e.target.value)"
                           />
                       </td>
                       <td class="py-2 px-2 text-center w-48 align-top">
                           <div class="flex flex-col gap-1 items-start">
                               <!-- Existing Dependencies -->
                               <div v-for="dep in task.dependencies" :key="dep.id" 
                                    class="bg-orange-50 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1 w-full justify-between">
                                   <span class="truncate max-w-[100px]" :title="dep.name">{{ dep.name }}</span>
                                   <button @click="$emit('remove-dependency', task.id, dep.id)" class="text-orange-400 hover:text-red-500"><X size="10"/></button>
                               </div>
                               
                               <!-- Add Button -->
                               <div v-if="addingDepFor !== task.id" class="w-full">
                                   <button @click="addingDepFor = task.id" class="text-gray-400 hover:text-blue-500 text-xs flex items-center gap-1">
                                       <Link size="12" /> Link
                                   </button>
                               </div>
                               
                               <!-- Select Predecessor -->
                               <div v-else class="flex items-center gap-1 w-full">
                                   <select class="w-full text-[10px] border rounded py-0.5" 
                                           @change="(e) => onAddDependency(task.id, e.target.value)"
                                           @blur="addingDepFor = null">
                                       <option value="">Select...</option>
                                       <option v-for="t in wp.tasks.filter(t => t.id !== task.id)" :key="t.id" :value="t.id">
                                           {{ t.name }}
                                       </option>
                                   </select>
                               </div>
                           </div>
                       </td>
                       <td class="py-2 text-center text-gray-400">
                            <!-- Actions -->
                       </td>
                  </tr>
                  <!-- Draft Row -->
                  <tr class="bg-gray-50/50">
                       <td class="py-3 pl-2">
                           <input placeholder="+ Nueva tarea..." 
                                  class="w-full bg-transparent border-none outline-none text-gray-600 placeholder-gray-400 focus:ring-0" 
                                  v-model="draftName"
                                  @keydown.enter="handleSaveDraft" 
                           />
                       </td>
                       <td v-for="role in roleColumns" :key="role.id" class="py-2 text-center">
                            <input 
                               type="number" 
                               min="0"
                               placeholder="-"
                               class="w-16 border border-gray-200 rounded px-1 py-0.5 text-center focus:border-blue-500 outline-none bg-white"
                               v-model="draftEstimations[role.id]"
                               @keydown.enter="handleSaveDraft"
                           />
                       </td>
                       <td class="py-2 text-center">
                           <button v-if="draftName" @click="handleSaveDraft" class="text-blue-600 text-xs font-bold hover:underline">
                               Guardar
                           </button>
                       </td>
                       <td></td>
                  </tr>
              </tbody>
          </table>
      </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Trash, ChevronDown, ChevronRight, Link, X } from 'lucide-vue-next'
import dayjs from '@/config/dayjs'

const props = defineProps({
  wp: { type: Object, required: true },
  roleColumns: { type: Array, required: true },
  initiallyExpanded: { type: Boolean, default: false }
})

const emit = defineEmits([
  'update-wp-date', 
  'delete', 
  'update-task-name', 
  'update-est', 
  'save-draft', 
  'add-dependency', 
  'remove-dependency'
])

const isExpanded = ref(props.initiallyExpanded)
const toggleExpand = () => isExpanded.value = !isExpanded.value

const addingDepFor = ref(null)

const draftName = ref('')
const draftEstimations = ref({})

// Shared date utils (duplicated here for independence, or could be imported)
const parseDateSafe = (val) => {
    if (!val) return null
    if (!isNaN(val) && !isNaN(parseFloat(val))) {
        return dayjs.utc(parseInt(val))
    }
    return dayjs(val)
}

const formatDate = (dateVal) => {
    const d = parseDateSafe(dateVal)
    return d && d.isValid() ? d.format('YYYY-MM-DD') : ''
}

const onStartDateChange = (e) => {
    emit('update-wp-date', props.wp, e.target.value)
}

const onAddDependency = (taskId, predecessorId) => {
    if(predecessorId) {
        emit('add-dependency', taskId, predecessorId)
        addingDepFor.value = null
    }
}

const handleSaveDraft = () => {
    if(!draftName.value) return
    emit('save-draft', props.wp.id, { name: draftName.value, estimations: draftEstimations.value })
    // Clear local state
    draftName.value = ''
    draftEstimations.value = {}
}
</script>
