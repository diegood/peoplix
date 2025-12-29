<script setup>
import { ref } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { 
  GET_CUSTOM_FIELD_DEFINITIONS,
  CREATE_CUSTOM_FIELD_DEFINITION,
  UPDATE_CUSTOM_FIELD_DEFINITION,
  DELETE_CUSTOM_FIELD_DEFINITION
} from '@/graphql/queries'
import { Plus, X, Edit2, Save, GripVertical } from 'lucide-vue-next'
import { useNotificationStore } from '@/stores/notificationStore'


const notificationStore = useNotificationStore()

const { result, loading, error } = useQuery(GET_CUSTOM_FIELD_DEFINITIONS)
const { mutate: createField } = useMutation(CREATE_CUSTOM_FIELD_DEFINITION, { refetchQueries: ['GetCustomFieldDefinitions'] })
const { mutate: updateField } = useMutation(UPDATE_CUSTOM_FIELD_DEFINITION, { refetchQueries: ['GetCustomFieldDefinitions'] })
const { mutate: deleteField } = useMutation(DELETE_CUSTOM_FIELD_DEFINITION, { refetchQueries: ['GetCustomFieldDefinitions'] })

const showAddForm = ref(false)
const editingId = ref(null)

const form = ref({
  fieldName: '',
  fieldLabel: '',
  fieldType: 'text',
  isRequired: false,
  fieldConfig: '{}'
})

const fieldTypes = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Fecha' },
  { value: 'textarea', label: 'Área de Texto' },
  { value: 'select', label: 'Selección' },
  { value: 'checkbox', label: 'Checkbox' }
]

const resetForm = () => {
  form.value = {
    fieldName: '',
    fieldLabel: '',
    fieldType: 'text',
    isRequired: false,
    fieldConfig: '{}'
  }
  showAddForm.value = false
  editingId.value = null
}

const handleCreate = async () => {
  if (!form.value.fieldName || !form.value.fieldLabel) {
    notificationStore.showToast('Completa nombre y etiqueta del campo', 'error')
    return
  }
  
  try {
    await createField({
      fieldName: form.value.fieldName,
      fieldLabel: form.value.fieldLabel,
      fieldType: form.value.fieldType,
      fieldConfig: form.value.fieldConfig,
      isRequired: form.value.isRequired,
      order: result.value?.customFieldDefinitions?.length || 0
    })
    
    resetForm()
    notificationStore.showToast('Campo creado exitosamente', 'success')
  } catch (err) {
    notificationStore.showToast(err.message || 'Error al crear campo', 'error')
  }
}

const startEdit = (field) => {
  editingId.value = field.id
  form.value = {
    fieldName: field.fieldName,
    fieldLabel: field.fieldLabel,
    fieldType: field.fieldType,
    isRequired: field.isRequired,
    fieldConfig: field.fieldConfig
  }
}

const saveEdit = async (fieldId) => {
  try {
    await updateField({
      id: fieldId,
      fieldName: form.value.fieldName,
      fieldLabel: form.value.fieldLabel,
      fieldType: form.value.fieldType,
      fieldConfig: form.value.fieldConfig,
      isRequired: form.value.isRequired
    })
    
    resetForm()
    notificationStore.showToast('Campo actualizado', 'success')
  } catch (err) {
    notificationStore.showToast(err.message || 'Error al actualizar', 'error')
  }
}

const handleDelete = async (fieldId) => {
  const confirmed = await notificationStore.showDialog(
    '¿Eliminar este campo personalizado? Se perderán todos los valores asociados.',
    'Eliminar Campo'
  )
  
  if (!confirmed) return
  
  try {
    await deleteField({ id: fieldId })
    notificationStore.showToast('Campo eliminado', 'success')
  } catch (err) {
    notificationStore.showToast(err.message || 'Error al eliminar', 'error')
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <div>
        <h3 class="text-lg font-bold text-gray-800">Campos Personalizados</h3>
        <p class="text-sm text-gray-500">Define campos adicionales para los colaboradores</p>
      </div>
      <button @click="showAddForm = !showAddForm" 
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2">
        <Plus size="18" />
        Nuevo Campo
      </button>
    </div>
    
    <div v-if="showAddForm" class="bg-white p-4 rounded-xl shadow-sm border border-blue-200">
      <h4 class="font-bold text-gray-800 mb-3">Crear Nuevo Campo</h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label class="text-sm font-medium text-gray-700">Nombre del Campo (ID)</label>
          <input v-model="form.fieldName" 
                 type="text" 
                 placeholder="ej: departamento" 
                 class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
        </div>
        <div>
          <label class="text-sm font-medium text-gray-700">Etiqueta (Visible)</label>
          <input v-model="form.fieldLabel" 
                 type="text" 
                 placeholder="ej: Departamento" 
                 class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
        </div>
        <div>
          <label class="text-sm font-medium text-gray-700">Tipo de Campo</label>
          <select v-model="form.fieldType" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option v-for="type in fieldTypes" :key="type.value" :value="type.value">
              {{ type.label }}
            </option>
          </select>
        </div>
        <div class="flex items-center gap-2 pt-6">
          <input v-model="form.isRequired" type="checkbox" id="required" class="rounded" />
          <label for="required" class="text-sm font-medium text-gray-700">Campo Requerido</label>
        </div>
      </div>
      <div class="flex gap-2 mt-4">
        <button @click="handleCreate" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
          Crear Campo
        </button>
        <button @click="resetForm" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm">
          Cancelar
        </button>
      </div>
    </div>
    
    <div v-if="loading" class="text-gray-500">Cargando campos...</div>
    <div v-else-if="error" class="text-red-500">{{ error.message }}</div>
    
    <div v-else-if="result?.customFieldDefinitions?.length" class="space-y-2">
      <div v-for="field in result.customFieldDefinitions" :key="field.id" 
           class="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        
        <div v-if="editingId !== field.id" class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <GripVertical size="18" class="text-gray-300 cursor-move" />
            <div>
              <div class="font-medium text-gray-800">{{ field.fieldLabel }}</div>
              <div class="text-xs text-gray-500">
                <span class="font-mono bg-gray-100 px-1 rounded">{{ field.fieldName }}</span>
                <span class="mx-2">•</span>
                <span>{{ fieldTypes.find(t => t.value === field.fieldType)?.label }}</span>
                <span v-if="field.isRequired" class="ml-2 text-red-500">*</span>
              </div>
            </div>
          </div>
          <div class="flex gap-2">
            <button @click="startEdit(field)" class="p-2 hover:bg-blue-50 rounded text-blue-600">
              <Edit2 size="16" />
            </button>
            <button @click="handleDelete(field.id)" class="p-2 hover:bg-red-50 rounded text-red-600">
              <X size="16" />
            </button>
          </div>
        </div>
        
        <div v-else class="space-y-3">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-medium text-gray-600">Nombre del Campo</label>
              <input v-model="form.fieldName" type="text" class="w-full px-2 py-1 border rounded text-sm" />
            </div>
            <div>
              <label class="text-xs font-medium text-gray-600">Etiqueta</label>
              <input v-model="form.fieldLabel" type="text" class="w-full px-2 py-1 border rounded text-sm" />
            </div>
            <div>
              <label class="text-xs font-medium text-gray-600">Tipo</label>
              <select v-model="form.fieldType" class="w-full px-2 py-1 border rounded text-sm">
                <option v-for="type in fieldTypes" :key="type.value" :value="type.value">
                  {{ type.label }}
                </option>
              </select>
            </div>
            <div class="flex items-center gap-2 pt-4">
              <input v-model="form.isRequired" type="checkbox" id="edit-required" class="rounded" />
              <label for="edit-required" class="text-xs font-medium text-gray-600">Requerido</label>
            </div>
          </div>
          <div class="flex gap-2">
            <button @click="saveEdit(field.id)" class="px-3 py-1 bg-blue-600 text-white rounded text-sm flex items-center gap-1">
              <Save size="14" />
              Guardar
            </button>
            <button @click="resetForm" class="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="text-center py-8 text-gray-400">
      <p>No hay campos personalizados configurados</p>
      <p class="text-sm mt-1">Crea tu primer campo para comenzar</p>
    </div>
  </div>
</template>
