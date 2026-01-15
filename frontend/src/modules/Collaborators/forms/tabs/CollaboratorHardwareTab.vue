<script setup>
import { ref } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import { 
  ADD_HARDWARE, 
  REMOVE_HARDWARE 
} from '@/modules/Collaborators/graphql/collaborator.mutations'
import { Plus, Trash2, Laptop } from 'lucide-vue-next'
import { useNotificationStore } from '@/stores/notificationStore'

const props = defineProps({
  collaboratorId: { type: String, required: true },
  hardware: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:hardware'])
const notificationStore = useNotificationStore()

const addingHardware = ref(false)
const newHardwareForm = ref({ name: '', type: 'Laptop', serialNumber: '' })

const { mutate: addHardware } = useMutation(ADD_HARDWARE)
const { mutate: removeHardware } = useMutation(REMOVE_HARDWARE)


const onSaveHardware = async () => {
  if (!newHardwareForm.value.name) return
  try {
    const res = await addHardware({
      collaboratorId: props.collaboratorId,
      name: newHardwareForm.value.name,
      type: newHardwareForm.value.type,
      serialNumber: newHardwareForm.value.serialNumber || null
    })
    
    if (res?.data?.addHardware) {
        const newList = [...props.hardware, res.data.addHardware]
        emit('update:hardware', newList)
    }

    addingHardware.value = false
    newHardwareForm.value = { name: '', type: 'Laptop', serialNumber: '' }
    notificationStore.showToast('Hardware agregado', 'success')
  } catch (err) {
    notificationStore.showToast(err.message, 'error')
  }
}

const onRemoveHardware = async (hwId) => {
    try {
        await removeHardware({ id: hwId })
        const newList = props.hardware.filter(h => h.id !== hwId)
        emit('update:hardware', newList)
        notificationStore.showToast('Hardware eliminado', 'success')
    } catch (err) {
        notificationStore.showToast(err.message, 'error')
    }
}
</script>

<template>
    <div class="space-y-4">
         <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div class="flex justify-between items-center mb-4">
                <h3 class="font-bold text-gray-700">Inventario de Hardware</h3>
                <button @click="addingHardware = !addingHardware" class="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors text-xs flex items-center gap-1">
                    <Plus size="14" /> Asignar Equipo
                </button>
            </div>

            <div v-if="addingHardware" class="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
                <div class="grid grid-cols-3 gap-2 align-end">
                    <div class="col-span-3 md:col-span-1">
                        <input v-model="newHardwareForm.name" placeholder="Nombre (ej. MacBook Pro)" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all" />
                    </div>
                    <div>
                         <select v-model="newHardwareForm.type" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all">
                            <option>Laptop</option>
                            <option>Monitor</option>
                            <option>Phone</option>
                            <option>Tablet</option>
                            <option>Keyboard</option>
                            <option>Mouse</option>
                            <option>Otro</option>
                        </select>
                    </div>
                    <div class="flex gap-2">
                         <input v-model="newHardwareForm.serialNumber" placeholder="Serial No." class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all" />
                         <button @click="onSaveHardware" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors shadow-sm hover:shadow">Guardar</button>
                    </div>
                </div>
            </div>

            <div class="space-y-2">
                <div v-for="hw in hardware" :key="hw.id" 
                     class="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-gray-100 text-gray-500 rounded">
                            <Laptop size="18" />
                        </div>
                        <div>
                            <div class="font-medium text-gray-800">{{ hw.name }}</div>
                            <div class="text-xs text-gray-500 flex gap-2">
                                <span>{{ hw.type }}</span>
                                <span v-if="hw.serialNumber" class="text-gray-400">#{{ hw.serialNumber }}</span>
                            </div>
                        </div>
                    </div>
                    <button @click="onRemoveHardware(hw.id)" class="text-gray-300 hover:text-red-500">
                        <Trash2 size="16" />
                    </button>
                </div>
                <div v-if="!hardware?.length" class="text-center py-8 text-gray-400 italic">
                    Sin hardware asignado.
                </div>
            </div>
         </div>
    </div>
</template>
