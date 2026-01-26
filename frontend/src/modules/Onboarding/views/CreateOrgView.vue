<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/modules/Auth/stores/auth.store'
import { useMutation } from '@vue/apollo-composable'
import gql from 'graphql-tag'

const router = useRouter()
const authStore = useAuthStore()

const currentStep = ref(1) // 1: User Info, 2: Organization Info

const firstName = ref('')
const lastName = ref('')
const orgName = ref('')
const orgTag = ref('')
const isLoading = ref(false)
const error = ref('')

const CREATE_ORG_MUTATION = gql`
  mutation CreateOrganization($name: String!, $tag: String!, $adminEmail: String!, $adminFirstName: String!, $adminLastName: String!, $linkExistingUser: Boolean) {
    createOrganization(
      name: $name
      tag: $tag
      adminEmail: $adminEmail
      adminFirstName: $adminFirstName
      adminLastName: $adminLastName
      linkExistingUser: $linkExistingUser
    ) {
      id
      tag
    }
  }
`

const { mutate: createOrg } = useMutation(CREATE_ORG_MUTATION)

const nextStep = () => {
    if (currentStep.value === 1) {
        if (!firstName.value || !lastName.value) {
            error.value = 'Por favor completa nombre y apellido.'
            return
        }
    }
    error.value = ''
    currentStep.value++
}

const prevStep = () => {
    error.value = ''
    currentStep.value--
}

const handleCreateOrg = async () => {
    isLoading.value = true
    error.value = ''
    
    // We assume the authStore.user has email or username
    const userEmail = authStore.user?.email || authStore.user?.userName 
    
    try {
        const result = await createOrg({
            name: orgName.value,
            tag: orgTag.value,
            adminEmail: userEmail,
            adminFirstName: firstName.value,
            adminLastName: lastName.value,
            linkExistingUser: true
        })
        
        if (result?.data?.createOrganization) {
            // Success. Logout to refresh permissions.
            // Using a notification or simple state message instead of alert
            authStore.logout()
            // Router will redirect to login automatically
        }
    } catch (e) {
        console.error(e)
        // Show friendly error message
        let msg = e.message || 'Error al crear la organización'
        if (msg.includes('already exists')) msg = 'Una organización con este TAG ya existe.'
        error.value = msg
    } finally {
        isLoading.value = false
    }
}

const generateTag = () => {
    if (orgName.value && !orgTag.value) {
        orgTag.value = orgName.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)
    }
}

const updateTag = (e) => {
    orgTag.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)
}
</script>

<template>
    <div class="min-h-screen flex items-center justify-center bg-gray-900 text-gray-200">
        <div class="max-w-md w-full p-8 bg-gray-800 rounded-lg shadow-lg">
            
            <!-- Header -->
            <div class="mb-8 text-center">
                <h2 class="text-3xl font-bold text-blue-400 mb-2">Bienvenido a Peoplix</h2>
                <p class="text-gray-400 text-sm">Configuración inicial de tu cuenta</p>
            </div>

            <!-- Steps Indicator -->
            <div class="flex items-center justify-center mb-8 gap-4">
                <div :class="['w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm', currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400']">1</div>
                <div :class="['w-12 h-1 rounded', currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-700']"></div>
                <div :class="['w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm', currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400']">2</div>
            </div>
            
            <form @submit.prevent="currentStep === 2 ? handleCreateOrg() : nextStep()">
                
                <!-- Step 1: User Info -->
                <div v-if="currentStep === 1" class="space-y-6">
                    <h3 class="text-xl font-semibold text-white">Datos Personales</h3>
                    <p class="text-sm text-gray-400">Para empezar, dinos cómo te llamas.</p>

                    <div>
                        <label class="block text-sm font-medium mb-1">Nombre</label>
                        <input 
                            v-model="firstName"
                            type="text" 
                            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded focus:border-blue-500 focus:outline-none"
                            placeholder="Ej. Juan"
                            required
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Apellido</label>
                        <input 
                            v-model="lastName"
                            type="text" 
                            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded focus:border-blue-500 focus:outline-none"
                            placeholder="Ej. Pérez"
                            required
                        />
                    </div>
                    
                    <button 
                        type="button"
                        @click="nextStep"
                        class="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded text-white font-bold transition mt-4"
                    >
                        Continuar
                    </button>
                </div>

                <!-- Step 2: Org Info -->
                <div v-if="currentStep === 2" class="space-y-6">
                    <h3 class="text-xl font-semibold text-white">Tu Organización</h3>
                    <p class="text-sm text-gray-400">Crea el espacio de trabajo para tu equipo.</p>

                    <div>
                        <label class="block text-sm font-medium mb-1">Nombre de la Organización</label>
                        <input 
                            v-model="orgName"
                            @input="generateTag"
                            type="text" 
                            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded focus:border-blue-500 focus:outline-none"
                            placeholder="Ej. Mi Empresa S.A."
                            required
                        />
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-1">Tag (Identificador)</label>
                        <input 
                            :value="orgTag"
                            @input="updateTag"
                            type="text" 
                            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded focus:border-blue-500 focus:outline-none uppercase font-mono"
                            placeholder="MIEMPRESA"
                            maxlength="10"
                            required
                        />
                        <p class="text-xs text-gray-500 mt-1">Identificador único para URLs (ej. /MIEMPRESA/proyectos)</p>
                    </div>

                    <div v-if="error" class="text-red-400 text-sm font-medium p-2 bg-red-900/30 rounded border border-red-800">
                        {{ error }}
                    </div>

                    <div class="flex gap-4 mt-6">
                         <button 
                            type="button"
                            @click="prevStep"
                            class="w-1/3 py-2 bg-gray-600 hover:bg-gray-500 rounded text-white font-semibold transition"
                        >
                            Volver
                        </button>
                        <button 
                            type="submit" 
                            :disabled="isLoading"
                            class="w-2/3 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white font-bold transition disabled:opacity-50 flex justify-center items-center gap-2"
                        >
                            <span v-if="isLoading" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                            {{ isLoading ? 'Creando...' : 'Crear Organización' }}
                        </button>
                    </div>
                </div>

            </form>
        </div>
    </div>
</template>
