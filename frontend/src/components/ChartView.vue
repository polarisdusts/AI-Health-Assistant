<template>
  <div class="card">
    <div class="card-header">
      <span class="card-title">指标达成率</span>
      <div class="chart-controls">
        <select v-model="dataMode" class="form-select" style="width: auto; padding: 6px 12px; font-size: 0.8rem;">
          <option value="exercise">运动指标</option>
          <option value="nutrition">营养摄入</option>
        </select>
        <button v-for="type in chartTypes" :key="type.value" class="chart-type-btn" :class="{ active: currentChartType === type.value }" @click="currentChartType = type.value">{{ type.label }}</button>
      </div>
    </div>
    <div class="chart-container">
      <canvas ref="chartCanvas"></canvas>
    </div>
    <!-- Nutrition summary row -->
    <div v-if="dataMode === 'nutrition'" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--gray-100);">
      <div v-for="n in nutritionSummary" :key="n.key" style="text-align: center; padding: 8px; background: var(--gray-50); border-radius: 8px;">
        <div style="font-size: 0.75rem; color: var(--text-secondary);">{{ n.label }}</div>
        <div style="font-weight: 600; font-size: 1rem; color: n.color;">{{ n.current }}/{{ n.target }}{{ n.unit }}</div>
        <div class="metric-progress" style="margin-top: 4px; height: 3px;">
          <div class="metric-progress-bar" :style="{ width: Math.min((n.current/n.target)*100,100) + '%', background: n.color }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

const props = defineProps({
  calorieRatio: { type: Number, default: 0 },
  stepRatio: { type: Number, default: 0 },
  activityRatio: { type: Number, default: 0 },
});
const chartCanvas = ref(null);
const currentChartType = ref("doughnut");
const dataMode = ref("exercise");
let chartInstance = null;

const nutritionSummary = [
  { key: "protein", label: "蛋白质", current: 45, target: 70, unit: "g", color: "#3b82f6" },
  { key: "carbs", label: "碳水", current: 180, target: 250, unit: "g", color: "#10b981" },
  { key: "fat", label: "脂肪", current: 35, target: 60, unit: "g", color: "#f59e0b" },
  { key: "fiber", label: "膳食纤维", current: 12, target: 25, unit: "g", color: "#8b5cf6" },
  { key: "sugar", label: "糖分", current: 28, target: 40, unit: "g", color: "#ec4899" },
  { key: "water", label: "水分", current: 1200, target: 2000, unit: "ml", color: "#06b6d4" },
];

const chartTypes = [
  { value: "doughnut", label: "环形图" },
  { value: "pie", label: "饼状图" },
  { value: "bar", label: "柱状图" },
];

const chartData = computed(() => {
  if (dataMode.value === "exercise") {
    return buildExerciseChartData();
  } else {
    return buildNutritionChartData();
  }
});

function buildExerciseChartData() {
  const labels = ["卡路里", "步数", "活动次数"];
  const ratios = [Math.min(props.calorieRatio, 1), Math.min(props.stepRatio, 1), Math.min(props.activityRatio, 1)];
  const allZero = ratios.every((r) => r === 0);
  let datasets = [];

  if (currentChartType.value === "bar") {
    datasets = [{
      label: "达成率",
      data: allZero ? [0, 0, 0] : ratios.map((r) => Math.round(r * 100)),
      backgroundColor: allZero ? ["#e5e7eb", "#e5e7eb", "#e5e7eb"] : ["#f97316", "#3b82f6", "#10b981"],
      borderRadius: 6,
    }];
    return { labels, datasets };
  } else {
    const dataVals = allZero ? [1] : ratios.map((r) => Math.max(Math.round(r * 100), 1));
    const bgColors = allZero ? ["#e5e7eb"] : ["#f97316", "#3b82f6", "#10b981"];
    return {
      labels: allZero ? ["暂无数据"] : labels,
      datasets: [{ data: dataVals, backgroundColor: bgColors, borderWidth: 0, hoverOffset: 8 }],
    };
  }
}

function buildNutritionChartData() {
  const items = nutritionSummary;
  const targets = items.map((n) => Math.min((n.current / n.target) * 100, 100));
  const allZero = targets.every((t) => t === 0);

  if (currentChartType.value === "bar") {
    return {
      labels: items.map((n) => n.label),
      datasets: [{
        label: "摄入占比(%)",
        data: targets.map((t) => Math.round(t)),
        backgroundColor: items.map((n) => allZero ? "#e5e7eb" : n.color),
        borderRadius: 6,
      }],
    };
  } else {
    const nonZero = items.filter((n) => n.current > 0);
    if (nonZero.length === 0) {
      return {
        labels: ["暂无数据"],
        datasets: [{ data: [1], backgroundColor: ["#e5e7eb"], borderWidth: 0 }],
      };
    }
    return {
      labels: nonZero.map((n) => n.label),
      datasets: [{
        data: nonZero.map((n) => Math.max(Math.round((n.current / n.target) * 100), 1)),
        backgroundColor: nonZero.map((n) => n.color),
        borderWidth: 0,
        hoverOffset: 8,
      }],
    };
  }
}

const renderChart = async () => {
  await nextTick();
  if (!chartCanvas.value) return;
  if (chartInstance) chartInstance.destroy();
  const ctx = chartCanvas.value.getContext("2d");
  const data = chartData.value;
  const config = {
    type: currentChartType.value,
    data: data,
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom", labels: { padding: 16, usePointStyle: true, font: { size: 12 } } },
        tooltip: { callbacks: { label: (context) => { const v = context.parsed; const val = typeof v === "object" ? v.y || v.x : v; return context.label + ": " + Math.round(val) + "%"; } } },
      },
    },
  };
  if (currentChartType.value === "bar") {
    config.options.scales = { y: { beginAtZero: true, max: 100, ticks: { callback: (v) => v + "%" } } };
  }
  chartInstance = new Chart(ctx, config);
};

watch([currentChartType, dataMode, () => props.calorieRatio, () => props.stepRatio, () => props.activityRatio], () => renderChart());
onMounted(() => renderChart());
</script>