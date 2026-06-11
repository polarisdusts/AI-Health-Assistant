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
import { ref, computed, onMounted, inject } from "vue";
import AppLayout from "../components/AppLayout.vue";
import ProgressRing from "../components/ProgressRing.vue";
import ChartView from "../components/ChartView.vue";
import { useAuthStore } from "../store/auth.js";
import { useHealthStore } from "../store/health.js";
import { getSportIcon } from "../utils/icons.js";
import PlanGenerator from "../components/PlanGenerator.vue";

const authStore = useAuthStore();
const healthStore = useHealthStore();
const showToast = inject("showToast");
const showPlanGen = ref(false);
const showWeightModal = ref(false);
const weightForm = ref({ weight: "", note: "" });

function pct(val, goal) { return goal > 0 ? Math.min((val / goal) * 100, 100) : 0; }
const calorieRatio = computed(() => { const g = getTarget('calorie', 600); return g > 0 ? healthStore.todaySummary.calories / g : 0; });
const stepRatio = computed(() => { const g = getTarget('steps', 6000); return g > 0 ? healthStore.todaySummary.steps / g : 0; });
const activityRatio = computed(() => { const g = getTarget('activities', 10); return g > 0 ? healthStore.todaySummary.activities / g : 0; });

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

const submitWeight = async () => {
  if (!weightForm.value.weight) { showToast("请填写体重", "error"); return; }
  const result = await healthStore.recordWeight(weightForm.value);
  if (result.success) { showToast("体重记录成功！", "success"); showWeightModal.value = false; weightForm.value = { weight: "", note: "" }; }
  else showToast(result.error, "error");
};

onMounted(() => { authStore.loadUser(); authStore.loadProfile(); healthStore.loadCurrentSummary(); healthStore.loadActivePlan(); });
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