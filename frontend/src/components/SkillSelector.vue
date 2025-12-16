<script setup>
import { ref, computed } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { GET_SKILLS } from '@/graphql/queries'
import { CREATE_SKILL } from '@/graphql/mutations'
import { Search, Plus } from 'lucide-vue-next'

defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Buscar skill...'
  }
})

const emit = defineEmits(['update:modelValue', 'select'])

const { result } = useQuery(GET_SKILLS)
const { mutate: createSkill } = useMutation(CREATE_SKILL, {
  refetchQueries: ['GetSkills']
})

const searchQuery = ref('')
const isOpen = ref(false)
const inputRef = ref(null)

const matches = computed(() => {
    if (!result.value?.skills) return []
    const q = searchQuery.value.toLowerCase()
    if (!q) return result.value.skills.slice(0, 5) // Recent/Top 5
    return result.value.skills.filter(t => t.name.toLowerCase().includes(q))
})

const handleInput = (e) => {
    searchQuery.value = e.target.value
    isOpen.value = true
    emit('update:modelValue', searchQuery.value)
}

const selectTech = (tech) => {
    searchQuery.value = tech.name
    emit('update:modelValue', tech.name)
    emit('select', tech)
    isOpen.value = false
}

const handleBlur = () => {
    setTimeout(() => {
        isOpen.value = false
    }, 200)
}

const createNew = async () => {
    const name = searchQuery.value
    if (!name) return
    
    const existing = result.value.skills.find(t => t.name.toLowerCase() === name.toLowerCase())
    if (existing) {
        selectTech(existing)
        return
    }

    try {
        const res = await createSkill({ name })
        if (res.data?.createSkill) {
             selectTech(res.data.createSkill)
        }
    } catch (e) {
        console.error("Error creating skill", e)
    }
}

</script>

<template>
  <div class="relative w-full">
    <div class="relative">
        <input 
            ref="inputRef"
            type="text" 
            :value="searchQuery" 
            @input="handleInput"
            @focus="isOpen = true"
            @blur="handleBlur"
            :placeholder="placeholder"
            class="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
        <Search class="absolute left-3 top-2.5 text-gray-400" size="18" />
    </div>

    <div v-if="isOpen && (matches.length > 0 || searchQuery)" 
         class="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-y-auto">
        
        <ul v-if="matches.length > 0">
            <li v-for="tech in matches" :key="tech.id"
                @click="selectTech(tech)"
                class="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700">
                {{ tech.name }}
            </li>
        </ul>
        
        <div v-if="searchQuery && !matches.find(m => m.name.toLowerCase() === searchQuery.toLowerCase())"
             @click="createNew"
             class="px-4 py-2 border-t border-gray-50 hover:bg-blue-50 cursor-pointer text-blue-600 text-sm flex items-center gap-2">
            <Plus size="14" />
            Crear "<strong>{{ searchQuery }}</strong>"
        </div>
    </div>
  </div>
</template>
