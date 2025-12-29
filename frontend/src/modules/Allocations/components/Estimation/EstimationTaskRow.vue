<template>
    <tr class="border-b border-gray-50 hover:bg-gray-50">
        <td class="py-2 pl-2 font-medium relative group align-top">
            <div class="flex flex-col gap-1">
                <div class="flex items-center gap-2">
                    <div class="relative">
                        <button @click="toggleDescEdit" 
                                class="text-gray-400 hover:text-blue-600 transition-colors"
                                :class="{'text-blue-600': task.description}">
                            <FileText :size="14" />
                        </button>

                        <div v-if="isDescEditing" 
                                class="absolute top-8 left-0 z-50 bg-white border shadow-lg rounded p-3 w-72">
                            <textarea 
                                :value="task.description" 
                                @change="(e) => $emit('update-desc', task.id, e.target.value)"
                                class="w-full text-xs border rounded p-2 h-24 focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-2"
                                placeholder="Añadir descripción..."
                            ></textarea>
                            <div class="flex justify-end gap-2">
                                <button @click="isDescEditing = false" class="text-xs text-gray-500 hover:text-gray-800">Cerrar</button>
                            </div>
                        </div>
                    </div>

                    <input :value="task.name" 
                            class="w-full bg-transparent border-none outline-none focus:ring-0 font-medium text-gray-700"
                            @change="(e) => $emit('update-name', task.id, e.target.value)" />
                </div>
                <div class="pl-6 text-[10px] text-gray-400 flex items-center gap-2" v-if="summary.totalHours > 0">
                    <span class="font-bold text-gray-500">{{ summary.totalHours }}h</span>
                    <span>|</span>
                    <span>{{ summary.dateRange }}</span>
                </div>
            </div>
        </td>

        <td v-for="role in roleColumns" :key="role.id" class="py-2 text-center relative">
            <div class="flex items-center justify-center gap-1 group">
                <div class="relative">
                        <button 
                            @click="$emit('open-assignment', task, role)"
                            class="w-6 h-6 rounded-full flex items-center justify-center transition-colors border border-transparent hover:border-gray-200"
                            :class="getEst(task, role.id)?.collaborator ? 'bg-white' : 'text-gray-300 hover:text-blue-500'"
                            title="Asignar colaborador"
                        >
                            <template v-if="getEst(task, role.id)?.collaborator">
                                <img v-if="getEst(task, role.id).collaborator.avatar" 
                                        :src="getEst(task, role.id).collaborator.avatar" 
                                        class="w-5 h-5 rounded-full object-cover" />
                                <div v-else class="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-[10px] flex items-center justify-center font-bold">
                                    {{ getEst(task, role.id).collaborator.firstName[0] }}{{ getEst(task, role.id).collaborator.lastName[0] }}
                                </div>
                            </template>
                            <User v-else :size="14" />
                        </button>
                </div>

                <input 
                    type="number" 
                    min="0"
                    class="w-16 border rounded px-1 py-0.5 text-center focus:border-blue-500 outline-none"
                    :value="getEst(task, role.id)?.hours || 0"
                    @change="(e) => $emit('update-est', task.id, role.id, e.target.value)"
                />
            </div>
        </td>
        <td class="py-2 px-2 text-center w-48 align-top">
            <div class="flex flex-col gap-1 items-start">
                <div v-for="dep in task.dependencies" :key="dep.id" 
                        class="bg-orange-50 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1 w-full justify-between">
                    <span class="truncate max-w-[100px]" :title="dep.name">{{ dep.name }}</span>
                    <button @click="$emit('remove-dependency', task.id, dep.id)" class="text-orange-400 hover:text-red-500"><X size="10"/></button>
                </div>
                
                <div v-if="!isAddingDep" class="w-full">
                    <button @click="isAddingDep = true" class="text-gray-400 hover:text-blue-500 text-xs flex items-center gap-1">
                        <Link size="12" /> Link
                    </button>
                </div>
                
                <div v-else class="flex items-center gap-1 w-full">
                    <select class="w-full text-[10px] border rounded py-0.5" 
                            @change="(e) => { $emit('add-dependency', task.id, e.target.value); isAddingDep = false }"
                            @blur="isAddingDep = false">
                        <option value="">Select...</option>
                        <option v-for="t in tasksOptions" :key="t.id" :value="t.id">
                            {{ t.name }}
                        </option>
                    </select>
                </div>
            </div>
        </td>
        <td class="py-2 px-2 text-center w-10">
                <button @click="$emit('delete-task', task.id)" class="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash :size="14" />
                </button>
        </td>
        <td class="py-2 text-center text-gray-400">
        </td>
    </tr>
</template>

<script setup>
import { ref, computed } from 'vue'
import { FileText, User, X, Link, Trash } from 'lucide-vue-next'
import { getEst, getTaskSummary } from '@/modules/Allocations/helpers/estimationHelpers'

const props = defineProps({
    task: Object,
    roleColumns: Array,
    tasksOptions: Array
})

defineEmits(['update-name', 'update-desc', 'update-est', 'delete-task', 'add-dependency', 'remove-dependency', 'open-assignment'])

const isDescEditing = ref(false)
const isAddingDep = ref(false)

const toggleDescEdit = () => { isDescEditing.value = !isDescEditing.value }

const summary = computed(() => getTaskSummary(props.task))
</script>
