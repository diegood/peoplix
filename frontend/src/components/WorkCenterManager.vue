<template>
    <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Centros de Trabajo
        </h2>
        
        <!-- List -->
        <div v-if="!editingId && !creating" class="space-y-4">
             <div class="flex justify-end">
                <button @click="startCreate" class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                    </svg>
                    Nuevo Centro
                </button>
            </div>
            
            <div v-if="loading" class="text-gray-500 text-center py-4">Cargando centros...</div>
            <div v-else-if="workCenters.length === 0" class="text-gray-500 text-center py-8 bg-gray-50 rounded border border-dashed border-gray-300">
                No hay centros de trabajo definidos.
            </div>
            
            <div v-else class="grid grid-cols-1 gap-4">
                <div v-for="wc in workCenters" :key="wc.id" class="border rounded-lg p-4 hover:bg-gray-50 flex justify-between items-center transition-colors">
                    <div>
                        <h3 class="font-medium text-lg">{{ wc.name }}</h3>
                        <div class="text-sm text-gray-500 flex gap-2">
                            <span class="bg-gray-100 px-2 py-0.5 rounded text-xs border border-gray-200">{{ wc.countryCode }}</span>
                            <span v-if="wc.regionCode" class="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs border border-blue-100">{{ wc.regionCode }}</span>
                            <span v-else class="text-gray-400 italic text-xs">Nacional</span>
                        </div>
                    </div>
                    <div class="flex gap-2">
                         <button @click="manageHolidays(wc)" class="p-2 text-indigo-600 hover:bg-indigo-50 rounded" title="Gestionar Festivos">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </button>
                        <button @click="startEdit(wc)" class="p-2 text-gray-600 hover:bg-gray-100 rounded" title="Editar">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                        <button @click="confirmDelete(wc)" class="p-2 text-red-600 hover:bg-red-50 rounded" title="Eliminar">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Form (Create/Edit WorkCenter) -->
        <div v-if="creating || editingId" class="bg-gray-50 p-4 rounded border border-gray-200">
             <h3 class="font-bold mb-4">{{ creating ? 'Nuevo Centro de Trabajo' : 'Editar Centro de Trabajo' }}</h3>
             <form @submit.prevent="saveWorkCenter" class="space-y-4">
                 <div>
                     <label class="block text-sm font-medium text-gray-700">Nombre</label>
                     <input v-model="form.name" type="text" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                 </div>
                 <div class="grid grid-cols-2 gap-4">
                     <div>
                         <label class="block text-sm font-medium text-gray-700">
                             Código País 
                             <span class="text-xs text-gray-500 font-normal">(ISO Alpha-2, ej: ES)</span>
                         </label>
                         <input v-model="form.countryCode" type="text" required maxlength="2" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm uppercase">
                     </div>
                     <div>
                         <label class="block text-sm font-medium text-gray-700">
                             Código Región 
                             <span class="text-xs text-gray-500 font-normal">(Opcional, ej: MD para Madrid)</span>
                         </label>
                         <input v-model="form.regionCode" type="text" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm uppercase">
                     </div>
                 </div>
                 
                 <div class="flex justify-end gap-2 pt-2">
                     <button type="button" @click="cancelForm" class="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                     <button type="submit" :disabled="saving" class="px-3 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                         {{ saving ? 'Guardando...' : 'Guardar' }}
                     </button>
                 </div>
             </form>
        </div>
        
        <!-- Holiday Calendar Manager (Using BaseModal) -->
        <BaseModal 
            :isOpen="!!managingHolidaysFor"
            :title="managingHolidaysFor ? `Gestionar Festivos: ${managingHolidaysFor.name}` : ''"
            maxWidth="max-w-4xl"
            @close="managingHolidaysFor = null"
        >
            <div class="flex flex-col h-full">
                <!-- Year Selector and Import -->
                <div class="flex flex-wrap items-end gap-4 mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Año</label>
                        <select v-model="selectedYear" class="block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10">
                            <option :value="getCurrentYear() - 1">{{ getCurrentYear() - 1 }}</option>
                            <option :value="getCurrentYear()">{{ getCurrentYear() }}</option>
                            <option :value="getCurrentYear() + 1">{{ getCurrentYear() + 1 }}</option>
                        </select>
                    </div>
                    
                    <div class="flex-grow">
                            <div class="text-sm text-gray-600 mb-2">
                                Importar automáticamente festivos para <strong>{{ managingHolidaysFor?.countryCode }}</strong> 
                                <span v-if="managingHolidaysFor?.regionCode">- <strong>{{ managingHolidaysFor?.regionCode }}</strong></span>
                            </div>
                            <button @click="importHolidays" :disabled="importing" class="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded hover:bg-blue-100 shadow-sm flex items-center gap-2 h-10 w-full justify-center sm:w-auto">
                                <svg v-if="!importing" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
                                </svg>
                                <span v-else class="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full mr-2"></span>
                                {{ importing ? 'Importando...' : 'Importar desde Nager.Date' }}
                            </button>
                    </div>
                    
                    <div class="w-full sm:w-auto mt-2 sm:mt-0">
                        <button @click="saveCalendar" :disabled="savingCalendar" class="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 shadow-sm flex items-center justify-center gap-2 h-10">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                            </svg>
                            {{ savingCalendar ? 'Guardando...' : 'Guardar Calendario' }}
                        </button>
                    </div>
                </div>
                
                <!-- Holiday List -->
                <div class="space-y-2">
                    <div class="flex justify-between items-center mb-2">
                        <h4 class="font-bold text-gray-700">Festivos ({{ holidays.length }})</h4>
                        <button @click="addHoliday" class="text-sm text-indigo-600 hover:text-indigo-800 flex items-center font-medium">
                            + Agregar manual
                        </button>
                    </div>
                    
                    <div v-if="holidays.length === 0" class="text-center py-8 bg-gray-50 border border-dashed rounded text-gray-500 italic">
                        No hay festivos definidos para este año. Importa o agrega manualmente.
                    </div>
                    
                    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <div v-for="(h, index) in holidays" :key="index" class="bg-white border p-3 rounded shadow-sm relative group hover:border-indigo-300 transition-colors">
                                <button @click="removeHoliday(index)" class="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                    </svg>
                                </button>
                                <div class="flex items-center gap-2 mb-1">
                                    <input type="date" v-model="h.date" class="text-sm border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500 py-0.5 px-2 w-32">
                                </div>
                                <input type="text" v-model="h.localName" placeholder="Nombre (ej. Navidad)" class="w-full text-sm border-transparent hover:border-gray-200 focus:border-indigo-500 rounded px-0 py-0.5 font-medium -ml-1">
                            </div>
                    </div>
                </div>
            </div>
        </BaseModal>
    </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { gql } from 'graphql-tag'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { useNotificationStore } from '@/stores/notificationStore'
import BaseModal from '@/components/BaseModal.vue'

const notificationStore = useNotificationStore()

// Definitions
const GET_WORK_CENTERS = gql`
    query GetWorkCenters {
        workCenters {
            id
            name
            regionCode
            countryCode
            publicHolidayCalendars {
                id
                year
                holidays {
                    date
                    localName
                    name
                    countryCode
                }
            }
        }
    }
`

const CREATE_WORK_CENTER = gql`
    mutation CreateWorkCenter($name: String!, $countryCode: String!, $regionCode: String) {
        createWorkCenter(name: $name, countryCode: $countryCode, regionCode: $regionCode) {
            id
            name
        }
    }
`

const UPDATE_WORK_CENTER = gql`
    mutation UpdateWorkCenter($id: ID!, $name: String, $countryCode: String, $regionCode: String) {
        updateWorkCenter(id: $id, name: $name, countryCode: $countryCode, regionCode: $regionCode) {
            id
        }
    }
`

const DELETE_WORK_CENTER = gql`
    mutation DeleteWorkCenter($id: ID!) {
        deleteWorkCenter(id: $id)
    }
`

const IMPORT_HOLIDAYS = gql`
    mutation ImportPublicHolidays($year: Int!, $countryCode: String!, $regionCode: String) {
        importPublicHolidays(year: $year, countryCode: $countryCode, regionCode: $regionCode) {
            date
            localName
            name
        }
    }
`

const SAVE_CALENDAR = gql`
    mutation SavePublicHolidayCalendar($workCenterId: ID!, $year: Int!, $holidays: [PublicHolidayInput!]!) {
        savePublicHolidayCalendar(workCenterId: $workCenterId, year: $year, holidays: $holidays) {
            id
        }
    }
`

// State
const { result, loading, refetch } = useQuery(GET_WORK_CENTERS)
const workCenters = computed(() => result.value?.workCenters || [])

const creating = ref(false)
const editingId = ref(null)
const saving = ref(false)
const form = reactive({
    name: '',
    countryCode: 'ES',
    regionCode: ''
})

const managingHolidaysFor = ref(null)
const selectedYear = ref(new Date().getFullYear())
const holidays = ref([])
const importing = ref(false)
const savingCalendar = ref(false)


// Queries / Mutations
const { mutate: createWorkCenter } = useMutation(CREATE_WORK_CENTER)
const { mutate: updateWorkCenter } = useMutation(UPDATE_WORK_CENTER)
const { mutate: deleteWorkCenter } = useMutation(DELETE_WORK_CENTER)
const { mutate: importHolidaysApi } = useMutation(IMPORT_HOLIDAYS)
const { mutate: saveCalendarApi } = useMutation(SAVE_CALENDAR)


// Methods - CRUD
const startCreate = () => {
    creating.value = true
    editingId.value = null
    form.name = ''
    form.countryCode = 'ES'
    form.regionCode = ''
}

const startEdit = (wc) => {
    creating.value = false
    editingId.value = wc.id
    form.name = wc.name
    form.countryCode = wc.countryCode
    form.regionCode = wc.regionCode
}

const cancelForm = () => {
    creating.value = false
    editingId.value = null
}

const saveWorkCenter = async () => {
    saving.value = true
    try {
        if (creating.value) {
            await createWorkCenter({
                name: form.name,
                countryCode: form.countryCode,
                regionCode: form.regionCode || null
            })
        } else {
            await updateWorkCenter({
                id: editingId.value,
                name: form.name,
                countryCode: form.countryCode,
                regionCode: form.regionCode || null
            })
        }
        await refetch()
        cancelForm()
        notificationStore.showToast('Centro de trabajo guardado correctamente', 'success')
    } catch (e) {
        console.error(e)
        notificationStore.showToast('Error al guardar centro: ' + e.message, 'error')
    } finally {
        saving.value = false
    }
}

const confirmDelete = async (wc) => {
    const confirmed = await notificationStore.showDialog(
        `¿Estás seguro de eliminar "${wc.name}"? Esto afectará a los colaboradores asignados.`,
        'Eliminar Centro de Trabajo'
    )
    
    if (confirmed) {
        try {
            await deleteWorkCenter({ id: wc.id })
            await refetch()
            notificationStore.showToast('Centro eliminado correctamente', 'success')
        } catch (e) {
            console.error(e)
            notificationStore.showToast('Error al eliminar: ' + e.message, 'error')
        }
    }
}

const getCurrentYear = () => new Date().getFullYear()

// Methods - Holidays
const manageHolidays = (wc) => {
    managingHolidaysFor.value = wc
    selectedYear.value = getCurrentYear()
    loadHolidaysForYear(wc, selectedYear.value)
}

const loadHolidaysForYear = (wc, year) => {
    holidays.value = []
    const calendar = wc.publicHolidayCalendars.find(c => c.year === year)
    if (calendar && calendar.holidays) {
        // Backend now returns typed objects, no parsing needed
        holidays.value = calendar.holidays.map(h => ({
            date: h.date,
            localName: h.localName,
            name: h.name,
            countryCode: h.countryCode
        }))
    }
}

watch(selectedYear, (newYear) => {
    if (managingHolidaysFor.value) {
        loadHolidaysForYear(managingHolidaysFor.value, newYear)
    }
})

const importHolidays = async () => {
    importing.value = true
    try {
        const res = await importHolidaysApi({
            year: selectedYear.value,
            countryCode: managingHolidaysFor.value.countryCode,
            regionCode: managingHolidaysFor.value.regionCode || null
        })
        
        // Merge with existing avoiding duplicates
        const imported = res.data.importPublicHolidays
        const existingDates = new Set(holidays.value.map(h => h.date))
        
        imported.forEach(h => {
            if (!existingDates.has(h.date)) {
                holidays.value.push({
                    date: h.date,
                    localName: h.localName,
                    name: h.name,
                    countryCode: h.countryCode
                })
            }
        })
        
        // Sort
        holidays.value.sort((a, b) => a.date.localeCompare(b.date))
        notificationStore.showToast(`Importados ${imported.length} festivos`, 'success')
        
    } catch (e) {
        console.error(e)
        notificationStore.showToast('Error importando: ' + e.message, 'error')
    } finally {
        importing.value = false
    }
}

const addHoliday = () => {
    holidays.value.push({
        date: `${selectedYear.value}-01-01`,
        localName: 'Nuevo Festivo',
        name: 'New Holiday',
        countryCode: managingHolidaysFor.value.countryCode
    })
}

const removeHoliday = (index) => {
    holidays.value.splice(index, 1)
}

const saveCalendar = async () => {
    savingCalendar.value = true
    try {
        // Prepare payload conformant to PublicHolidayInput
        const holidaysPayload = holidays.value.map(h => ({
            date: h.date,
            localName: h.localName,
            name: h.name,
            countryCode: h.countryCode || 'ES'
        }))

         await saveCalendarApi({
            workCenterId: managingHolidaysFor.value.id,
            year: selectedYear.value,
            holidays: holidaysPayload
        })
        
        await refetch()
        
        // Update local object to reflect saved state immediately without closing modal
        // (Not strictly necessary as refetch updates workCenters, but good for UI consistency if we stayed open)
        // Re-load to confirm
        const updatedWc = workCenters.value.find(wc => wc.id === managingHolidaysFor.value.id)
        if (updatedWc) {
             managingHolidaysFor.value = updatedWc
             loadHolidaysForYear(updatedWc, selectedYear.value)
        }

        notificationStore.showToast('Calendario guardado correctamente', 'success')
    } catch (e) {
        console.error(e)
        notificationStore.showToast('Error guardando: ' + e.message, 'error')
    } finally {
        savingCalendar.value = false
    }
}


</script>
