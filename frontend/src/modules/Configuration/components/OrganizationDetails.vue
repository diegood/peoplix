<script setup>
import { ref } from 'vue'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { Building2, Save } from 'lucide-vue-next'

import { GET_ORGANIZATION, UPDATE_ORGANIZATION } from '../graphql/organization.queries'

const { loading, onResult } = useQuery(GET_ORGANIZATION)
const { mutate: updateOrg } = useMutation(UPDATE_ORGANIZATION)

const form = ref({
    name: '',
    tag: ''
})

const isDirty = ref(false)
const showSuccess = ref(false)

onResult((res) => {
    if (res.data?.organization) {
        form.value.name = res.data.organization.name
        form.value.tag = res.data.organization.tag || ''
    }
})

const save = async () => {
    try {
        await updateOrg({
            name: form.value.name,
            tag: form.value.tag
        })
        isDirty.value = false
        showSuccess.value = true
        setTimeout(() => showSuccess.value = false, 3000)
    } catch (e) {
        console.error(e)
    }
}
</script>

<template>
    <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center gap-3 mb-6">
            <div class="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Building2 class="w-6 h-6" />
            </div>
            <div>
                <h3 class="font-bold text-gray-900">Detalles de la Organización</h3>
                <p class="text-sm text-gray-500">Información básica y prefijo para URLs.</p>
            </div>
        </div>

        <div v-if="loading" class="text-gray-400 text-sm">Cargando...</div>
        
        <div v-else class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input 
                    v-model="form.name" 
                    @input="isDirty = true"
                    class="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                    type="text"
                />
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tag (Prefijo URL)</label>
                <div class="flex items-center">
                   <span class="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm h-[38px]">
                       /
                   </span>
                   <input 
                        v-model="form.tag" 
                        @input="isDirty = true"
                        class="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        type="text"
                        placeholder="ORG"
                    />
                </div>
                <p class="mt-1 text-xs text-gray-400">Usado en las URLs del tablero Kanban. Ej: /ORG/kanban/...</p>
            </div>

            <div class="pt-2 flex items-center justify-between">
                <span v-if="showSuccess" class="text-green-600 text-sm font-medium animate-pulse">
                    ¡Guardado correctamente!
                </span>
                <span v-else></span>

                <button 
                    @click="save" 
                    :disabled="!isDirty"
                    :class="[
                        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                        isDirty 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    ]"
                >
                    <Save class="w-4 h-4" />
                    Guardar Cambios
                </button>
            </div>
        </div>
    </div>
</template>
