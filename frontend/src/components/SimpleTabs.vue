<script setup>
import { ref } from 'vue'

const props = defineProps(['tabs'])
const emit = defineEmits(['change'])

const activeTab = ref(props.tabs[0].id)

const selectTab = (id) => {
    activeTab.value = id
    emit('change', id)
}
</script>

<template>
    <div class="flex border-b border-gray-100">
        <button 
            v-for="tab in tabs" 
            :key="tab.id"
            @click="selectTab(tab.id)"
            class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
            :class="activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
        >
            {{ tab.label }}
        </button>
    </div>
</template>
