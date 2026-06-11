<template>
  <div class="progress-ring-container" :style="{ width: size + 'px', height: size + 'px' }">
    <svg
      :width="size"
      :height="size"
      :viewBox="`0 0 ${size} ${size}`"
    >
      <!-- Background circle -->
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        :stroke="bgColor"
        stroke-width="6"
        fill="none"
      />
      <!-- Progress circle -->
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        :stroke="progressColor"
        stroke-width="6"
        fill="none"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        stroke-linecap="round"
        :transform="`rotate(-90, ${size/2}, ${size/2})`"
        style="transition: stroke-dashoffset 0.8s ease"
      />
    </svg>
    <div class="progress-ring-center">
      <div class="progress-ring-value">{{ displayValue }}</div>
      <div v-if="unit" class="progress-ring-unit">{{ unit }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  value: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  size: { type: Number, default: 120 },
  unit: { type: String, default: "" },
  color: { type: String, default: "#f97316" },
  bgColor: { type: String, default: "#f3f4f6" },
});

const radius = computed(() => (props.size / 2) - 8);
const circumference = computed(() => 2 * Math.PI * radius.value);

const progress = computed(() => {
  const p = props.max > 0 ? (props.value / props.max) * 100 : 0;
  return Math.min(p, 100);
});

const dashOffset = computed(() => {
  return circumference.value - (progress.value / 100) * circumference.value;
});

const progressColor = computed(() => {
  if (progress.value >= 100) return "#10b981";
  if (progress.value >= 60) return props.color;
  if (progress.value >= 30) return "#f59e0b";
  return "#ef4444";
});

const displayValue = computed(() => {
  if (props.max && props.value >= 0) {
    return `${Math.round(props.value)}/${props.max}`;
  }
  return props.value;
});
</script>
