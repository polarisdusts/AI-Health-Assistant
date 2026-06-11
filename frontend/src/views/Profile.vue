<template>
  <AppLayout>
    <div class="page-header">
      <div>
        <h1 class="page-title">个人健康档案</h1>
        <p class="page-subtitle">完善你的健康信息，获得更精准的AI计划</p>
      </div>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div class="card">
        <div class="card-header"><span class="card-title">基本信息</span></div>
        <form @submit.prevent="saveProfile">
          <div class="form-group"><label class="form-label">年龄</label><input v-model.number="form.age" type="number" class="form-input" min="1" max="150" placeholder="请输入年龄" required /></div>
          <div class="form-group"><label class="form-label">性别</label><select v-model="form.gender" class="form-select" required><option value="">请选择</option><option value="male">男性</option><option value="female">女性</option><option value="other">其他</option></select></div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group"><label class="form-label">身高 (cm)</label><input v-model.number="form.height" type="number" step="0.1" class="form-input" placeholder="身高" required /></div>
            <div class="form-group"><label class="form-label">体重 (kg)</label><input v-model.number="form.weight" type="number" step="0.1" class="form-input" placeholder="体重" required /></div>
          </div>
          <div class="form-group"><label class="form-label">活动水平</label><select v-model="form.activity_level" class="form-select" required><option value="">请选择</option><option value="low">低活动量（久坐为主）</option><option value="medium">中等活动量（偶尔运动）</option><option value="high">高活动量（经常运动）</option></select></div>
          <div class="form-group"><label class="form-label">饮食偏好</label><select v-model="form.diet_preference" class="form-select" required><option value="">请选择</option><option value="vegetarian">素食</option><option value="balanced">均衡饮食</option><option value="high_protein">高蛋白</option></select></div>
          <div class="form-group"><label class="form-label">健康目标</label><textarea v-model="form.health_goal" class="form-textarea" placeholder="例如：减重5kg、增肌、提高耐力等" rows="3"></textarea></div>
          <button type="submit" class="btn btn-primary btn-lg" style="width: 100%;">保存档案</button>
        </form>
      </div>
      <div>
        <div class="card" style="margin-bottom: 20px;">
          <div class="card-header"><span class="card-title">每日目标设定</span></div>
          <div class="form-group"><label class="form-label">每日卡路里目标</label><input v-model.number="form.daily_calorie_goal" type="number" class="form-input" min="100" /></div>
          <div class="form-group"><label class="form-label">每日步数目标</label><input v-model.number="form.daily_step_goal" type="number" class="form-input" min="1000" step="500" /></div>
          <div class="form-group"><label class="form-label">每日活动次数目标</label><input v-model.number="form.daily_activity_goal" type="number" class="form-input" min="1" /></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">身体指标</span></div>
          <div v-if="form.height && form.weight" style="text-align: center; padding: 16px 0;">
            <div style="font-size: 3rem; font-weight: 700;" :style="{ color: bmiColor }">{{ bmi.toFixed(1) }}</div>
            <div style="font-size: 0.9rem; color: var(--text-secondary);">BMI 指数</div>
            <div style="margin-top: 8px; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: 500;" :style="{ background: bmiBg, color: bmiColor }">{{ bmiCategory }}</div>
          </div>
          <div v-else style="text-align: center; padding: 24px; color: var(--text-muted);">请填写身高体重查看BMI</div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, inject } from "vue";
import AppLayout from "../components/AppLayout.vue";
import { useAuthStore } from "../store/auth.js";

const authStore = useAuthStore();
const showToast = inject("showToast");
const form = ref({ age: null, gender: "", height: null, weight: null, activity_level: "", diet_preference: "", health_goal: "", daily_calorie_goal: 600, daily_step_goal: 6000, daily_activity_goal: 10 });

const bmi = computed(() => { if (!form.value.height || !form.value.weight) return 0; const h = form.value.height / 100; return form.value.weight / (h * h); });
const bmiCategory = computed(() => { const v = bmi.value; if (v < 18.5) return "偏瘦"; if (v < 24) return "正常"; if (v < 28) return "超重"; return "肥胖"; });
const bmiColor = computed(() => { const v = bmi.value; if (v < 18.5) return "#f59e0b"; if (v < 24) return "#10b981"; if (v < 28) return "#f97316"; return "#ef4444"; });
const bmiBg = computed(() => { const v = bmi.value; if (v < 18.5) return "#fef3c7"; if (v < 24) return "#f0fdf4"; if (v < 28) return "#fff7ed"; return "#fef2f2"; });

const saveProfile = async () => {
  const result = await authStore.updateProfile(form.value);
  if (result.success) showToast("健康档案已保存！", "success");
  else showToast(result.error || "保存失败", "error");
};

onMounted(async () => {
  await authStore.loadProfile();
  if (authStore.profile) {
    const p = authStore.profile;
    form.value = { age: p.age, gender: p.gender || "", height: p.height, weight: p.weight, activity_level: p.activity_level || "", diet_preference: p.diet_preference || "", health_goal: p.health_goal || "", daily_calorie_goal: p.daily_calorie_goal || 600, daily_step_goal: p.daily_step_goal || 6000, daily_activity_goal: p.daily_activity_goal || 10 };
  }
});
</script>