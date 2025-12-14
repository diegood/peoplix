<script setup>
import AllocationPanel from '@/modules/Allocations/views/AllocationPanel.vue'
</script>

<template>
  <div class="h-[calc(100vh-theme('spacing.4'))] flex flex-col">
    <div class="flex-1 overflow-hidden">
      <AllocationPanel />
    </div>
  </div>
</template>
