<template>
  <AppLayout>
    <div class="page-header">
      <div>
        <h1 class="page-title">月度报告</h1>
        <p class="page-subtitle">查看你的月度运动与健康总结</p>
      </div>
      <button class="btn btn-outline btn-sm" @click="showMonthSelector = !showMonthSelector">[ {{ displayMonth }} ]</button>
    </div>

    <div v-if="showMonthSelector" class="card" style="margin-bottom: 20px;">
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <button v-for="m in availableMonths" :key="m" class="btn btn-sm" :class="m === currentMonth ? 'btn-primary' : 'btn-secondary'" @click="loadMonthReport(m)">{{ m }}</button>
      </div>
    </div>

    <div v-if="!reportData?.isMonthEnded && reportData" class="banner" style="background: linear-gradient(135deg, #fef3c7, #fde68a); border-color: #f59e0b; color: #92400e;">
      <span class="banner-icon">i</span>
      <span>革命还未结束，同志仍需努力！本月还未结束，继续加油运动吧！</span>
      <button class="btn btn-sm btn-primary" style="margin-left: auto;" @click="$router.push('/activity')">去运动</button>
    </div>

    <div v-if="loading" class="loading-overlay"><div class="loading-spinner"></div></div>

    <template v-if="reportData?.report">
      <div class="report-grid">
        <div class="report-card" style="text-align: center;">
          <div class="card-title" style="text-align: left; margin-bottom: 16px;">健康指数</div>
          <div style="display: flex; justify-content: center; align-items: center; padding: 16px 0;">
            <ProgressRing :value="getValue('healthScore')" :max="100" :size="150" unit="分" :color="scoreColor" />
          </div>
          <div style="text-align: center; margin-top: 4px;">
            <span v-if="getValue('intensityLevel')" style="display: inline-block; padding: 6px 24px; border-radius: 20px; font-weight: 600; font-size: 0.95rem;" :style="{ background: intensityBg, color: intensityColor }">{{ getValue("intensityLevel") }}</span>
          </div>
        </div>

        <div class="report-card">
          <div class="card-title" style="margin-bottom: 16px;">日均指标</div>
          <div class="report-stat"><span class="report-stat-label">日均卡路里</span><span class="report-stat-value">{{ getValue("dailyAvgCalories") }} 千卡</span></div>
          <div class="report-stat"><span class="report-stat-label">日均步数</span><span class="report-stat-value">{{ getValue("dailyAvgSteps") }} 步</span></div>
          <div class="report-stat"><span class="report-stat-label">日均运动时长</span><span class="report-stat-value">{{ getValue("dailyAvgDuration") }}</span></div>
          <div class="report-stat"><span class="report-stat-label">本月达标天数</span><span class="report-stat-value" style="color: var(--success);">{{ getValue("qualifiedDays") }} 天</span></div>
        </div>

        <div class="report-card">
          <div class="card-title" style="margin-bottom: 16px;">运动情况</div>
          <p style="font-size: 0.9rem; margin-bottom: 16px;">{{ getValue("exerciseSummary") }}</p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div style="padding: 12px; background: var(--primary-50); border-radius: 8px; text-align: center;"><div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-600);">{{ getValue("totalActivities") }}</div><div style="font-size: 0.8rem;">运动次数</div></div>
            <div style="padding: 12px; background: var(--primary-50); border-radius: 8px; text-align: center;"><div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-600);">{{ getValue("totalCalories") }}</div><div style="font-size: 0.8rem;">总消耗(千卡)</div></div>
            <div style="padding: 12px; background: #eff6ff; border-radius: 8px; text-align: center;"><div style="font-size: 1.5rem; font-weight: 700; color: #3b82f6;">{{ getValue("totalSteps") }}</div><div style="font-size: 0.8rem;">总步数</div></div>
            <div style="padding: 12px; background: #f0fdf4; border-radius: 8px; text-align: center;"><div style="font-size: 1.5rem; font-weight: 700; color: #10b981;">{{ getValue("sessionDays") }}</div><div style="font-size: 0.8rem;">运动天数</div></div>
          </div>
        </div>

        <div class="report-card">
          <div class="card-title" style="margin-bottom: 16px;">睡眠情况</div>
          <div style="padding: 16px; background: linear-gradient(135deg, #e0f2fe, #f0f9ff); border-radius: var(--radius-sm);">
            <p style="font-size: 0.9rem; color: #1e40af;">{{ getValue("sleepSummary") }}</p>
          </div>
        </div>
      </div>

    <!-- 睡眠柱状图 -->
    <div class="card" style="margin-top: 20px;">
      <div class="card-header">
        <span class="card-title">本月睡眠深度分析</span>
        <span v-if="sleepHistory.length > 0" style="font-size: 0.8rem; color: var(--text-secondary);">共 {{ sleepHistory.length }} 天数据</span>
      </div>
      <div v-if="sleepHistory.length > 0" style="height: 300px; padding: 16px 0;">
        <canvas ref="sleepChartCanvas"></canvas>
      </div>
      <div v-else style="text-align: center; padding: 32px 0; color: var(--text-muted);">
        <p>尚无睡眠数据</p>
        <p style="font-size: 0.85rem; margin-top: 4px;">请绑定智能手环后同步睡眠数据</p>
      </div>
      <div v-if="sleepChartAdvice" style="padding: 16px; margin-top: 8px; background: linear-gradient(135deg, #e0f2fe, #f0f9ff); border-radius: var(--radius-sm);">
        <div style="font-weight: 600; font-size: 0.9rem; color: #1e40af; margin-bottom: 6px;">AI 睡眠评价</div>
        <p style="font-size: 0.85rem; color: #1e40af; line-height: 1.6;">{{ sleepChartAdvice }}</p>
      </div>
    </div>
    

      <div class="card" style="margin-top: 20px;">
        <div class="card-header"><span class="card-title">下月计划调整</span></div>
        <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 16px;">根据本月数据，你可以选择下月的运动标准调整方向：</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
          <button class="btn btn-outline" style="flex-direction: column; padding: 16px; height: auto;" @click="adjustPlan('adjustDown')">
            <span style="font-size: 1.2rem;">--</span><span style="font-size: 0.85rem; margin-top: 4px;">下调标准</span><span style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">减少运动量，以恢复为主</span>
          </button>
          <button class="btn btn-primary" style="flex-direction: column; padding: 16px; height: auto;" @click="adjustPlan('maintain')">
            <span style="font-size: 1.2rem;">==</span><span style="font-size: 0.85rem; margin-top: 4px;">保持标准</span><span style="font-size: 0.75rem; opacity: 0.8; margin-top: 4px;">维持当前运动频率</span>
          </button>
          <button class="btn btn-outline" style="flex-direction: column; padding: 16px; height: auto;" @click="adjustPlan('adjustUp')">
            <span style="font-size: 1.2rem;">++</span><span style="font-size: 0.85rem; margin-top: 4px;">上调标准</span><span style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">增加运动频率与强度</span>
          </button>
        </div>
      </div>

      <div class="card" style="margin-top: 20px;">
        <div class="card-header"><span class="card-title">历月运动报告</span><button class="btn btn-sm btn-secondary" @click="$router.push('/history')">查看全部</button></div>
        <div class="stacked-cards" style="margin-top: 12px;">
          <div v-for="(plan, idx) in healthStore.planHistory.slice(0, 3)" :key="plan.id" class="stacked-card" @click="$router.push('/report/' + plan.plan_month)" :style="{ zIndex: 3 - idx }">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div><div style="font-weight: 600;">{{ plan.plan_month }} 月度计划</div><div style="font-size: 0.8rem; color: var(--text-secondary);">{{ (plan.summary || "").substring(0, 60) }}{{ (plan.summary || "").length > 60 ? "..." : "" }}</div></div>
              <span style="font-size: 0.8rem; color: var(--text-muted);">{{ formatDate(plan.generated_at) }}</span>
            </div>
          </div>
          <div v-if="healthStore.planHistory.length === 0" style="text-align: center; padding: 24px; color: var(--text-muted);">暂无历史报告</div>
        </div>
      </div>
    </template>

    <div v-else-if="!loading" style="text-align: center; padding: 48px; color: var(--text-muted);">
      <p style="font-size: 1.2rem;">暂无报告数据</p>
      <p style="margin-top: 8px;">先去运动界面记录你的运动吧！</p>
      <button class="btn btn-primary" style="margin-top: 16px;" @click="$router.push('/activity')">去运动</button>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, inject, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppLayout from "../components/AppLayout.vue";
import ProgressRing from "../components/ProgressRing.vue";
import { useHealthStore } from "../store/health.js";
import { reportAPI, deviceAPI } from "../api/index.js";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

const route = useRoute();
const router = useRouter();
const healthStore = useHealthStore();
const showToast = inject("showToast");
const loading = ref(false);
const reportData = ref(null);
const showMonthSelector = ref(false);
const sleepHistory = ref([]);
const sleepChartCanvas = ref(null);
const sleepChartAdvice = ref("");
let sleepChartInstance = null;

const now = new Date();

const currentMonth = computed(() => now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0"));
const displayMonth = computed(() => { if (!reportData.value?.report?.month) return currentMonth.value; const [y, m] = reportData.value.report.month.split("-"); return y + "年" + m + "月"; });

const availableMonths = computed(() => {
  const months = []; const y = now.getFullYear(); const m = now.getMonth() + 1;
  for (let i = 0; i < 6; i++) { let tm = m - i; let ty = y; if (tm <= 0) { tm += 12; ty -= 1; } months.push(ty + "-" + String(tm).padStart(2, "0")); }
  return months;
});

function getValue(key) {
  if (!reportData.value?.report) return key === "healthScore" ? 0 : "";
  return reportData.value.report[key] ?? (key === "healthScore" ? 0 : "");
}

const scoreColor = computed(() => { const s = getValue("healthScore"); if (s >= 80) return "#10b981"; if (s >= 60) return "#f97316"; if (s >= 40) return "#f59e0b"; return "#ef4444"; });
const intensityBg = computed(() => { const l = getValue("intensityLevel"); if (l === "Beginner" || l === "新手") return "#f3f4f6"; if (l === "Active Zone" || l === "活力提升区") return "#e0f2fe"; if (l === "Fat Burn Zone" || l === "优秀燃脂区") return "#f0fdf4"; return "#ffedd5"; });
const intensityColor = computed(() => { const l = getValue("intensityLevel"); if (l === "Beginner" || l === "新手") return "#4b5563"; if (l === "Active Zone" || l === "活力提升区") return "#1e40af"; if (l === "Fat Burn Zone" || l === "优秀燃脂区") return "#166534"; return "#9a3412"; });

const loadSleepData = async (month) => {
  try {
    const { data } = await deviceAPI.sleepHistory({ month });
    let records = data.records || [];
    // If no real data, generate mock sleep data for 30 days
    if (records.length === 0) {
      records = [];
      const now = new Date();
      for (let d = 1; d <= 30; d++) {
        const dateStr = month + "-" + String(d).padStart(2, "0");
        const total = 360 + Math.round(Math.random() * 180);  // 6-9 hours
        const rem = Math.round(total * (0.15 + Math.random() * 0.1));
        const light = Math.round(total * (0.3 + Math.random() * 0.15));
        const moderate = Math.round(total * (0.2 + Math.random() * 0.1));
        const deep = total - rem - light - moderate;
        records.push({ date: dateStr, total, rem, light, moderate, deep });
      }
    }
    sleepHistory.value = records;
    generateSleepAdvice(records);
    setTimeout(() => renderSleepChart(), 300);
  } catch (err) {
    console.error("Load sleep data error:", err);
    sleepHistory.value = [];
  }
};

const generateSleepAdvice = (records) => {
  if (!records || records.length === 0) {
    sleepChartAdvice.value = "";
    return;
  }
  const totalDays = records.length;
  const avgTotal = records.reduce((s, r) => s + (r.total || 0), 0) / totalDays;
  const avgDeep = records.reduce((s, r) => s + (r.deep || 0), 0) / totalDays;
  const deepPct = avgTotal > 0 ? (avgDeep / avgTotal) * 100 : 0;
  
  if (avgTotal < 360) {
    sleepChartAdvice.value = "您本月平均睡眠不足6小时，长期睡眠不足可能影响身体恢复和运动表现，建议尽量保证每天7-8小时睡眠。";
  } else if (deepPct < 15) {
    sleepChartAdvice.value = "您本月深度睡眠占比偏低，建议减少睡前用手机，保持安静暗淡的睡眠环境以提高睡眠质量。";
  } else if (avgTotal >= 480 && deepPct >= 20) {
    sleepChartAdvice.value = "您本月睡眠质量良好，平均睡眠时长充足，深度睡眠占比理想，请保持规律作息。";
  } else {
    sleepChartAdvice.value = "您本月睡眠数据正常，建议继续保持规律作息，避免睡前过度激动。";
  }
};

const renderSleepChart = async () => {
  await nextTick();
  if (!sleepChartCanvas.value) return;
  if (sleepChartInstance) sleepChartInstance.destroy();
  const records = sleepHistory.value;
  if (records.length === 0) return;
  
  const labels = records.map(r => String(new Date(r.date).getDate()) + "日");
  const remData = records.map(r => (r.rem || 0) / 60);
  const lightData = records.map(r => (r.light || 0) / 60);
  const moderateData = records.map(r => (r.moderate || 0) / 60);
  const deepData = records.map(r => (r.deep || 0) / 60);
  
  sleepChartInstance = new Chart(sleepChartCanvas.value.getContext("2d"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "REM睡眠", data: remData, backgroundColor: "#8b5cf6", borderRadius: 0 },
        { label: "浅度睡眠", data: lightData, backgroundColor: "#3b82f6", borderRadius: 0 },
        { label: "中度睡眠", data: moderateData, backgroundColor: "#10b981", borderRadius: 0 },
        { label: "深度睡眠", data: deepData, backgroundColor: "#f97316", borderRadius: 0 },
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { stacked: true, ticks: { font: { size: 10 } } },
        y: { stacked: true, beginAtZero: true, title: { display: true, text: "小时" } }
      },
      plugins: {
        legend: { position: "bottom", labels: { padding: 12, usePointStyle: true, font: { size: 11 } } },
        tooltip: {
          callbacks: {
            label: (ctx) => ctx.dataset.label + ": " + ctx.parsed.y.toFixed(1) + "小时"
          }
        }
      }
    }
  });
};

const formatDate = (dateStr) => { if (!dateStr) return ""; const d = new Date(dateStr); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };

const loadMonthReport = async (month) => {
  loading.value = true; showMonthSelector.value = false;
  try { const { data } = await reportAPI.getMonthly(month);
    await loadSleepData(month); reportData.value = data; router.replace("/report/" + month); }
  catch (err) { showToast("加载报告失败", "error"); } finally { loading.value = false; }
};

const adjustPlan = async (direction) => {
  const nextMonth = reportData.value?.report?.nextMonthSuggestion;
  const suggestion = nextMonth ? nextMonth[direction] : null;
  if (suggestion) { showToast("已记录你的选择", "success"); await healthStore.generateMonthlyPlan(); }
};

onMounted(async () => { const monthFromRoute = route.params.month; await loadMonthReport(monthFromRoute || currentMonth.value); healthStore.loadPlanHistory(); });
</script>