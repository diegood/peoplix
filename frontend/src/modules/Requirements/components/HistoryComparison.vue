<script setup>
const props = defineProps({
  leftLabel: {
    type: String,
    default: 'Anterior'
  },
  rightLabel: {
    type: String,
    default: 'Actual'
  },
  leftValue: {
    type: [String, Number],
    default: ''
  },
  rightValue: {
    type: [String, Number],
    default: ''
  },
  minHeight: {
    type: Number,
    default: 60
  },
  leftClass: {
    type: String,
    default: ''
  },
  rightClass: {
    type: String,
    default: ''
  }
})
</script>

<template>
  <div class="grid md:grid-cols-2 gap-2">
    <div>
      <div class="font-semibold mb-1">{{ leftLabel }}</div>
      <div class="rounded p-2" :class="leftClass" :style="{ minHeight: `${minHeight}px` }">{{ leftValue || 'Vacío' }}</div>
    </div>
    <div>
      <div class="font-semibold mb-1">{{ rightLabel }}</div>
      <div class="rounded p-2" :class="rightClass" :style="{ minHeight: `${minHeight}px` }">{{ rightValue || 'Vacío' }}</div>
    </div>
  </div>
</template>
