<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <span class="logo-icon">H</span>
          <span>智康AI</span>
        </div>
        <div class="sidebar-subtitle">智能健康管理</div>
      </div>
      <nav class="sidebar-nav">
        <router-link v-for="item in navItems" :key="item.path" :to="item.path" class="nav-item" :class="{ active: $route.path.startsWith(item.path) }">
          <span class="nav-icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <div class="nav-item" @click="handleLogout">
          <span class="nav-icon">O</span>
          <span>退出登录</span>
        </div>
      </div>
    </aside>
    <main class="app-main">
      <div class="app-content">
        <slot />
      </div>
    </main>
    <div v-if="showFab" class="fab" :class="{ 'fab-active': fabOpen }" @click="toggleFab">+</div>
    <transition name="fab-slide">
      <div v-if="fabOpen" class="fab-menu">
        <button class="fab-menu-item" @click="openTargetModal">[ 调整目标 ]</button>
        <button class="fab-menu-item" @click="navigateTo('activity')">[ 运动 ]</button>
        <button class="fab-menu-item" @click="navigateTo('report')">[ 月度报告 ]</button>
      </div>
    </transition>

    <!-- Target adjustment modal -->
    <div v-if="showTargetModal" class="modal-overlay" @click.self="showTargetModal = false">
      <div class="modal-content" style="max-width: 420px;">
        <div class="modal-header">
          <span class="modal-title">调整目标指标</span>
          <button class="modal-close" @click="showTargetModal = false">x</button>
        </div>
        <div style="padding: 8px 0;">
          <div v-for="(goal, key) in targetGoals" :key="key" class="form-group">
            <label class="form-label">{{ goal.label }}</label>
            <div style="display: flex; align-items: center; gap: 12px;">
              <input v-model.number="goal.value" type="number" class="form-input" :min="goal.min" :max="goal.max" />
              <span style="font-size: 0.85rem; color: var(--text-secondary); white-space: nowrap;">{{ goal.unit }}</span>
            </div>
          </div>
          <button class="btn btn-primary" style="width: 100%; margin-top: 16px;" @click="saveTargets">保存目标</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, inject } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../store/auth.js";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const showToast = inject("showToast");
const fabOpen = ref(false);
const showTargetModal = ref(false);
const showFab = computed(() => route.path !== "/login" && route.path !== "/register");
const navItems = [
  { path: "/", icon: "D", label: "仪表盘" },
  { path: "/activity", icon: "A", label: "运动" },
  { path: "/diet", icon: "D", label: "饮食" },
  { path: "/report", icon: "R", label: "月度报告" },
  { path: "/history", icon: "H", label: "历史计划" },
  { path: "/settings", icon: "S", label: "设置" },
  { path: "/other", icon: "O", label: "其他功能" },
];

const targetGoals = reactive({
  calorie: { label: "每日卡路里目标", value: 600, unit: "千卡", min: 100, max: 5000 },
  steps: { label: "每日步数目标", value: 6000, unit: "步", min: 1000, max: 50000 },
  activities: { label: "每日活动次数目标", value: 10, unit: "次", min: 1, max: 50 },
});

// Load saved targets
const saved = localStorage.getItem("dailyTargets");
if (saved) {
  const parsed = JSON.parse(saved);
  targetGoals.calorie.value = parsed.calorie || 600;
  targetGoals.steps.value = parsed.steps || 6000;
  targetGoals.activities.value = parsed.activities || 10;
} else {
  // Load from profile if available
  targetGoals.calorie.value = authStore.profile?.daily_calorie_goal || 600;
  targetGoals.steps.value = authStore.profile?.daily_step_goal || 6000;
  targetGoals.activities.value = authStore.profile?.daily_activity_goal || 10;
}

const toggleFab = () => { fabOpen.value = !fabOpen.value; };

const openTargetModal = () => {
  fabOpen.value = false;
  // Reload current values
  targetGoals.calorie.value = parseInt(localStorage.getItem("dailyTargets_calorie")) || authStore.profile?.daily_calorie_goal || 600;
  targetGoals.steps.value = parseInt(localStorage.getItem("dailyTargets_steps")) || authStore.profile?.daily_step_goal || 6000;
  targetGoals.activities.value = parseInt(localStorage.getItem("dailyTargets_activities")) || authStore.profile?.daily_activity_goal || 10;
  showTargetModal.value = true;
};

const saveTargets = () => {
  localStorage.setItem("dailyTargets_calorie", targetGoals.calorie.value);
  localStorage.setItem("dailyTargets_steps", targetGoals.steps.value);
  localStorage.setItem("dailyTargets_activities", targetGoals.activities.value);
  localStorage.setItem("dailyTargets", JSON.stringify({
    calorie: targetGoals.calorie.value,
    steps: targetGoals.steps.value,
    activities: targetGoals.activities.value,
  }));
  showTargetModal.value = false;
  showToast("目标已保存", "success");
  window.dispatchEvent(new CustomEvent("targets-updated"));
};

const navigateTo = (name) => {
  fabOpen.value = false;
  if (name === "activity") router.push("/activity");
  else if (name === "report") router.push("/report");
};
const handleLogout = async () => {
  await authStore.logout();
  router.push("/login");
};
</script>