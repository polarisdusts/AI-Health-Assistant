<template>
  <AppLayout>
    <div class="page-header">
      <div>
        <h1 class="page-title">健康仪表盘</h1>
        <p class="page-subtitle">欢迎回来，{{ authStore.username }}！记录你的每一次进步</p>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="btn btn-outline btn-sm" @click="showWeightModal = true">[ 记录体重 ]</button>
        <button class="btn btn-primary btn-sm" @click="showPlanGen = true" :disabled="healthStore.loading">
          {{ healthStore.loading ? "生成中..." : "[ 生成本月计划 ]" }}
        </button>
      </div>
    </div>

    <div v-if="!authStore.hasProfile" class="banner">
      <span class="banner-icon">i</span>
      <span>完善个人资料，提升运动记录和健康监测准确性</span>
      <router-link to="/profile" class="btn btn-sm btn-primary" style="margin-left: auto;">去完善</router-link>
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-ring">
          <ProgressRing :value="healthStore.todaySummary.calories" :max="getTarget('calorie', 600)" :size="100" unit="千卡" />
        </div>
        <div class="metric-info">
          <div class="metric-label">卡路里</div>
          <div class="metric-value">{{ healthStore.todaySummary.calories }}</div>
          <div class="metric-target">目标: {{ getTarget('calorie', 600) }} 千卡</div>
          <div class="metric-progress">
            <div class="metric-progress-bar" :style="{ width: pct(healthStore.todaySummary.calories, getTarget('calorie', 600)) + '%', background: 'var(--primary-500)' }"></div>
          </div>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-ring">
          <ProgressRing :value="healthStore.todaySummary.steps" :max="getTarget('steps', 6000)" :size="100" unit="步" color="#3b82f6" />
        </div>
        <div class="metric-info">
          <div class="metric-label">步数</div>
          <div class="metric-value">{{ healthStore.todaySummary.steps }}</div>
          <div class="metric-target">目标: {{ getTarget('steps', 6000) }} 步</div>
          <div class="metric-progress">
            <div class="metric-progress-bar" :style="{ width: pct(healthStore.todaySummary.steps, getTarget('steps', 6000)) + '%', background: '#3b82f6' }"></div>
          </div>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-ring">
          <ProgressRing :value="healthStore.todaySummary.activities" :max="getTarget('activities', 10)" :size="100" unit="次" color="#10b981" />
        </div>
        <div class="metric-info">
          <div class="metric-label">活动次数</div>
          <div class="metric-value">{{ healthStore.todaySummary.activities }}</div>
          <div class="metric-target">目标: {{ getTarget('activities', 10) }} 次</div>
          <div class="metric-progress">
            <div class="metric-progress-bar" :style="{ width: pct(healthStore.todaySummary.activities, getTarget('activities', 10)) + '%', background: '#10b981' }"></div>
          </div>
        </div>
      </div>
    </div>

    <div style="margin-bottom: 24px;">
      <ChartView :calorie-ratio="calorieRatio" :step-ratio="stepRatio" :activity-ratio="activityRatio" />
    </div>

    <div v-if="deviceDataLoaded" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
      <!-- Heart Rate Chart -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">心率历史</span>
          <span v-if="deviceSummary.heartRate" style="font-size: 0.8rem; color: var(--text-secondary);">最新: {{ deviceSummary.heartRate.avg }} bpm</span>
        </div>
        <div v-if="heartRateHistory.length > 0" style="height: 200px; padding: 8px 0;"><canvas ref="hrChartCanvas"></canvas></div>
        <div v-else style="text-align: center; padding: 32px 0; color: var(--text-muted);">
          <p>尚无心率数据</p>
          <p style="font-size: 0.85rem;">请绑定智能手环后同步</p>
        </div>
      </div>
      <!-- Blood Oxygen Chart -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">血氧保和度</span>
          <span v-if="deviceSummary.bloodOxygen" style="font-size: 0.8rem; color: var(--text-secondary);">最新: {{ deviceSummary.bloodOxygen.spo2 }}%</span>
        </div>
        <div v-if="bloodOxygenHistory.length > 0" style="height: 200px; padding: 8px 0;"><canvas ref="boChartCanvas"></canvas></div>
        <div v-else style="text-align: center; padding: 32px 0; color: var(--text-muted);">
          <p>尚无血氧数据</p>
          <p style="font-size: 0.85rem;">请绑定智能手环后同步</p>
        </div>
      </div>
    </div>

    <!-- Sleep Card -->
    <div v-if="deviceSummary.sleep" class="card" style="margin-bottom: 24px;">
      <div class="card-header">
        <span class="card-title">睡眠分析</span>
        <span style="font-size: 0.8rem; color: var(--text-secondary);">{{ deviceSummary.sleep.date }}</span>
      </div>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 12px 0;">
        <div v-for="s in sleepData" :key="s.key" style="text-align: center; padding: 12px; background: var(--gray-50); border-radius: 8px;">
          <div style="font-size: 0.75rem; color: var(--text-secondary);">{{ s.label }}</div>
          <div style="font-weight: 600; font-size: 1.2rem; margin: 4px 0; color: s.color">{{ Math.round(s.minutes) }}分</div>
          <div class="metric-progress" style="height: 4px;">
            <div class="metric-progress-bar" :style="{ width: s.pct + '%', background: s.color }"></div>
          </div>
        </div>
      </div>
      <div v-if="sleepAdvice" style="padding: 12px; background: linear-gradient(135deg, #e0f2fe, #f0f9ff); border-radius: var(--radius-sm); font-size: 0.85rem; color: #1e40af;">
        {{ sleepAdvice }}
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
      <div class="card">
        <div class="card-header">
          <span class="card-title">中高强度活动统计</span>
        </div>
        <div style="text-align: center; padding: 20px 0;">
          <div style="font-size: 3rem; font-weight: 700; color: var(--primary-500);">{{ healthStore.monthlySummary.mvCount }}</div>
          <div style="color: var(--text-secondary); font-size: 0.9rem;">本月累计中高强度活动次数</div>
        </div>
        <div style="display: flex; justify-content: space-around; padding-top: 16px; border-top: 1px solid var(--gray-100);">
          <div style="text-align: center;"><div style="font-weight: 600;">{{ healthStore.monthlySummary.totalCalories }}</div><div style="font-size: 0.8rem; color: var(--text-secondary);">总消耗(千卡)</div></div>
          <div style="text-align: center;"><div style="font-weight: 600;">{{ healthStore.monthlySummary.totalSteps }}</div><div style="font-size: 0.8rem; color: var(--text-secondary);">总步数</div></div>
          <div style="text-align: center;"><div style="font-weight: 600;">{{ healthStore.monthlySummary.totalActivities }}</div><div style="font-size: 0.8rem; color: var(--text-secondary);">总活动次数</div></div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <span class="card-title">当前计划预览</span>
          <router-link to="/history" class="btn btn-sm btn-secondary">查看历史</router-link>
        </div>
        <div v-if="healthStore.activePlan" style="padding: 8px 0;">
          <div style="margin-bottom: 12px;">
            <div style="font-weight: 600; color: var(--primary-600);">饮食计划</div>
            <div v-if="healthStore.activePlan.diet_plan" style="font-size: 0.85rem; color: var(--text-secondary);">每日摄入: {{ healthStore.activePlan.diet_plan.daily_calories }} 千卡</div>
          </div>
          <div>
            <div style="font-weight: 600; color: var(--primary-600);">运动计划</div>
            <div v-if="healthStore.activePlan.exercise_plan" style="font-size: 0.85rem; color: var(--text-secondary);">每周 {{ healthStore.activePlan.exercise_plan.weekly_frequency }} 次 / 每次 {{ healthStore.activePlan.exercise_plan.duration_per_session }}</div>
          </div>
          <div v-if="healthStore.activePlan.summary" style="margin-top: 12px; padding: 12px; background: var(--primary-50); border-radius: 8px; font-size: 0.85rem; color: var(--primary-800);">{{ healthStore.activePlan.summary }}</div>
        </div>
        <div v-else style="text-align: center; padding: 24px 0; color: var(--text-muted);">
          <p>暂无活跃计划</p>
          <button class="btn btn-sm btn-outline" style="margin-top: 8px;" @click="showPlanGen = true">生成计划</button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">活动记录</span>
        <router-link to="/activity" class="btn btn-sm btn-primary">+ 添加运动</router-link>
      </div>
      <div v-if="healthStore.activities.length > 0" class="activity-list">
        <div v-for="activity in healthStore.activities" :key="activity.id" class="activity-card" :class="{ 'mv-activity': activity.is_moderate_vigorous }">
          <div class="activity-icon" v-html="getSportIcon(activity.activity_type)"></div>
          <div class="activity-details">
            <div class="activity-name">{{ activity.activity_name || activity.activity_type }}</div>
            <div class="activity-meta">
              <span class="activity-meta-item">时长: {{ activity.duration }}分钟</span>
              <span v-if="activity.distance" class="activity-meta-item">距离: {{ activity.distance }}km</span>
              <span class="activity-meta-item">消耗: {{ activity.calories_burned }}千卡</span>
              <span v-if="activity.avg_heart_rate" class="activity-meta-item">心率: {{ activity.avg_heart_rate }}bpm</span>
              <span class="activity-meta-item">日期: {{ formatDate(activity.record_date) }}</span>
              <span v-if="activity.is_moderate_vigorous" class="badge badge-mv">中高强度</span>
            </div>
          </div>
          <button class="btn btn-sm btn-secondary" @click="deleteActivity(activity.id)">x</button>
        </div>
      </div>
      <div v-else style="text-align: center; padding: 32px 0; color: var(--text-muted);">
        <p>暂无活动记录</p>
        <p style="font-size: 0.85rem; margin-top: 4px;">去运动界面记录你的第一次运动吧！</p>
      </div>
    </div>

    <div v-if="showWeightModal" class="modal-overlay" @click.self="showWeightModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <span class="modal-title">记录体重</span>
          <button class="modal-close" @click="showWeightModal = false">x</button>
        </div>
        <form @submit.prevent="submitWeight">
          <div class="form-group"><label class="form-label">体重 (kg)</label><input v-model="weightForm.weight" type="number" step="0.1" class="form-input" placeholder="请输入当前体重" required /></div>
          <div class="form-group"><label class="form-label">备注 (可选)</label><input v-model="weightForm.note" class="form-input" placeholder="例如：晨起空腹" /></div>
          <button type="submit" class="btn btn-primary" style="width: 100%;">保存记录</button>
        </form>
      </div>
    </div>
  </AppLayout>

    <PlanGenerator
      v-if="showPlanGen"
      :user-profile="authStore.profile || {}"
      :previous-activities="healthStore.activities"
      :previous-plan="healthStore.activePlan"
      @close="showPlanGen = false"
      @complete="onPlanComplete"
    />

</template>

<script setup>
import { ref, computed, onMounted, inject, nextTick } from "vue";
import AppLayout from "../components/AppLayout.vue";
import ProgressRing from "../components/ProgressRing.vue";
import ChartView from "../components/ChartView.vue";
import { useAuthStore } from "../store/auth.js";
import { useHealthStore } from "../store/health.js";
import { deviceAPI } from "../api/index.js";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);
import { getSportIcon } from "../utils/icons.js";
import PlanGenerator from "../components/PlanGenerator.vue";

const authStore = useAuthStore();
const healthStore = useHealthStore();
const showToast = inject("showToast");
const showPlanGen = ref(false);
const showWeightModal = ref(false);
const weightForm = ref({ weight: "", note: "" });

// Device data
const deviceDataLoaded = ref(false);
const deviceSummary = ref({ steps: null, calories: null, heartRate: null, bloodOxygen: null, sleep: null });
const heartRateHistory = ref([]);
const bloodOxygenHistory = ref([]);
const hrChartCanvas = ref(null);
const boChartCanvas = ref(null);
let hrChartInstance = null;
let boChartInstance = null;


function pct(val, goal) { return goal > 0 ? Math.min((val / goal) * 100, 100) : 0; }
const calorieRatio = computed(() => { const g = getTarget('calorie', 600); return g > 0 ? healthStore.todaySummary.calories / g : 0; });
const stepRatio = computed(() => { const g = getTarget('steps', 6000); return g > 0 ? healthStore.todaySummary.steps / g : 0; });
const activityRatio = computed(() => { const g = getTarget('activities', 10); return g > 0 ? healthStore.todaySummary.activities / g : 0; });

const sleepData = computed(() => {
  const s = deviceSummary.value.sleep;
  if (!s) return [];
  const total = s.total || 1;
  return [
    { key: "rem", label: "REM\u7761\u7720", minutes: s.rem || 0, pct: ((s.rem||0)/total)*100, color: "#8b5cf6" },
    { key: "light", label: "\u6d45度\u7761\u7720", minutes: s.light || 0, pct: ((s.light||0)/total)*100, color: "#3b82f6" },
    { key: "moderate", label: "\u4e2d度\u7761\u7720", minutes: s.moderate || 0, pct: ((s.moderate||0)/total)*100, color: "#10b981" },
    { key: "deep", label: "\u6df1度\u7761\u7720", minutes: s.deep || 0, pct: ((s.deep||0)/total)*100, color: "#f97316" },
  ];
});
const sleepAdvice = computed(() => {
  const s = deviceSummary.value.sleep;
  if (!s) return "";
  const total = s.total || 0;
  const deepPct = ((s.deep || 0) / (total || 1)) * 100;
  if (total < 360) return "您的睡眠时长不足\uff0c\u5efa\u8bae\u4fdd\u8bc1\u6bcf\u59296\u5c0f\u65f6\u4ee5\u4e0a\u7761\u7720\uff0c\u6709\u52a9\u4e8e\u8eab\u4f53\u6062\u590d\u3002";
  if (deepPct < 15) return "您的深度睡眠占比偏低\uff0c\u5efa\u8bae\u51cf\u5c11\u7761\u524d\u7528\u624b\u673a\uff0c\u4fdd\u6301\u5b89\u9759\u7761\u7720\u73af\u5883\u3002";
  if (total >= 480 && deepPct >= 20) return "您的\u7761\u7720\u8d28\u91cf\u826f\u597d\uff0c\u8bf7\u4fdd\u6301\u826f\u597d\u7684\u7761\u7720\u4e60\u60ef\uff01";
  return "睡眠数据正常\uff0c\u5efa\u8bae\u4fdd\u6301\u89c4\u5f8b\u4f5c\u606f\u3002";
});

const getTarget = (key, fallback) => {
  const val = parseInt(localStorage.getItem("dailyTargets_" + key));
  return val || (authStore.profile ? authStore.profile["daily_" + key + "_goal"] : null) || fallback;
};

const formatDate = (dateStr) => { if (!dateStr) return ""; const d = new Date(dateStr); return (d.getMonth() + 1) + "月" + d.getDate() + "日"; };

const generatePlan = async () => {
  const result = await healthStore.generateMonthlyPlan();
  if (result.success) showToast("月度计划已生成！", "success");
  else if (result.needProfile) showToast("请先完善个人档案", "warning");
  else showToast(result.error || "生成失败", "error");
};
const deleteActivity = async (id) => { await healthStore.deleteActivity(id); showToast("记录已删除", "info"); };
const onPlanComplete = (result) => { showPlanGen.value = false; showToast("计划已生成！", "success"); healthStore.loadActivePlan(); };

const loadDeviceData = async () => {
  try {
    const [sumRes, hrRes, boRes] = await Promise.all([
      deviceAPI.summary(),
      deviceAPI.heartRate(),
      deviceAPI.bloodOxygen()
    ]);
    const sum = sumRes.data;
    const hr = (hrRes.data.records || []);
    const bo = (boRes.data.records || []);

    // If no real device data, use simulated data for display
    if (!sum.heartRate && !sum.bloodOxygen && !sum.sleep) {
      const now = new Date();
      const mockHR = [];
      const mockBO = [];
      for (let i = 23; i >= 0; i--) {
        const t = new Date(now - i * 3600000);
        mockHR.push({ time: t.toISOString(), avg: 70 + Math.round(Math.random() * 30), max: 100 + Math.round(Math.random() * 40) });
        mockBO.push({ time: t.toISOString(), spo2: 95 + Math.random() * 3 });
      }
      heartRateHistory.value = mockHR;
      bloodOxygenHistory.value = mockBO;
      deviceSummary.value = {
        heartRate: { avg: 78, max: 132, time: now.toISOString() },
        bloodOxygen: { spo2: 97.5, time: now.toISOString() },
        sleep: { date: now.toISOString().split("T")[0], total: 450, rem: 90, light: 180, moderate: 100, deep: 80 }
      };
    } else {
      deviceSummary.value = sum;
      heartRateHistory.value = hr.slice(-24);
      bloodOxygenHistory.value = bo.slice(-24);
    }
    deviceDataLoaded.value = true;
  } catch (err) {
    console.error("Load device data error:", err);
    deviceDataLoaded.value = false;
  }
};

const renderHRChart = async () => {
  await nextTick();
  if (!hrChartCanvas.value) return;
  if (hrChartInstance) hrChartInstance.destroy();
  const records = heartRateHistory.value;
  if (records.length === 0) return;
  const labels = records.map(r => { const d = new Date(r.time); return d.getHours() + ":" + String(d.getMinutes()).padStart(2,"0"); });
  const avgData = records.map(r => r.avg || 0);
  const maxData = records.map(r => r.max || 0);
  hrChartInstance = new Chart(hrChartCanvas.value.getContext("2d"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "平均心率(bpm)", data: avgData, backgroundColor: "#f97316", borderRadius: 4 },
        { label: "最高心率(bpm)", data: maxData, backgroundColor: "#ef4444", borderRadius: 4 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, max: 220, ticks: { stepSize: 30 } } },
      plugins: { legend: { position: "bottom", labels: { font: { size: 11 }, usePointStyle: true } } }
    }
  });
};

const renderBOChart = async () => {
  await nextTick();
  if (!boChartCanvas.value) return;
  if (boChartInstance) boChartInstance.destroy();
  const records = bloodOxygenHistory.value;
  if (records.length === 0) return;
  const labels = records.map(r => { const d = new Date(r.time); return d.getHours() + ":" + String(d.getMinutes()).padStart(2,"0"); });
  const spo2Data = records.map(r => r.spo2 || 0);
  boChartInstance = new Chart(boChartCanvas.value.getContext("2d"), {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: "SpO2(%)", data: spo2Data, backgroundColor: "#3b82f6", borderRadius: 4 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: { y: { beginAtZero: false, min: 90, max: 100, ticks: { stepSize: 2 } } },
      plugins: { legend: { position: "bottom", labels: { font: { size: 11 }, usePointStyle: true } } }
    }
  });
};

const submitWeight = async () => {
  if (!weightForm.value.weight) { showToast("请填写体重", "error"); return; }
  const result = await healthStore.recordWeight(weightForm.value);
  if (result.success) { showToast("体重记录成功！", "success"); showWeightModal.value = false; weightForm.value = { weight: "", note: "" }; }
  else showToast(result.error, "error");
};

onMounted(async () => {
  authStore.loadUser();
  authStore.loadProfile();
  healthStore.loadCurrentSummary();
  healthStore.loadActivePlan();
  await loadDeviceData();
  setTimeout(() => { renderHRChart(); renderBOChart(); }, 500);
});
</script>

<style scoped>
.activity-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--primary-50);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--primary-600);
  padding: 8px;
}
.activity-icon svg {
  width: 100%;
  height: 100%;
}
</style>