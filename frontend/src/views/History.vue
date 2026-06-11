<template>
  <AppLayout>
    <div class="page-header">
      <div>
        <h1 class="page-title">历史计划与记录</h1>
        <p class="page-subtitle">查看过往生成的健康计划与体重变化趋势</p>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div class="card">
        <div class="card-header"><span class="card-title">体重变化趋势</span><button class="btn btn-sm btn-primary" @click="showWeightModal = true">+ 记录</button></div>
        <div v-if="healthStore.weightRecords.length > 0">
          <div style="display: flex; align-items: flex-end; gap: 4px; height: 160px; padding: 16px 0;">
            <div v-for="(record, idx) in visibleWeightRecords" :key="record.id" style="flex: 1; display: flex; flex-direction: column; align-items: center;">
              <div style="font-size: 0.65rem; color: var(--text-muted); margin-bottom: 4px;">{{ record.weight.toFixed(1) }}</div>
              <div :style="{ height: getBarHeight(record.weight) + 'px', width: '100%', maxWidth: '40px', background: weightBarColor(record), borderRadius: '4px 4px 0 0', minHeight: '8px' }"></div>
              <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 4px;">{{ formatDateShort(record.record_date) }}</div>
            </div>
          </div>
          <div style="margin-top: 12px;">
            <div v-for="record in healthStore.weightRecords.slice(-10).reverse()" :key="record.id" style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--gray-100); font-size: 0.85rem;">
              <span>{{ record.record_date }}</span><span style="font-weight: 600;">{{ record.weight }} kg</span><span v-if="record.note" style="color: var(--text-muted); font-size: 0.75rem;">{{ record.note }}</span>
            </div>
          </div>
        </div>
        <div v-else style="text-align: center; padding: 32px; color: var(--text-muted);">暂无体重记录，开始记录你的体重变化吧！</div>
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title">历史计划</span></div>
        <div class="stacked-cards">
          <div v-for="(plan, idx) in healthStore.planHistory" :key="plan.id" class="stacked-card" :style="{ zIndex: healthStore.planHistory.length - idx }">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-weight: 600;">{{ plan.plan_month }} 月度计划</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">{{ (plan.summary || "").substring(0, 80) || "暂无摘要" }}</div>
              </div>
              <div style="text-align: right; flex-shrink: 0; margin-left: 12px;">
                <div style="font-size: 0.75rem; color: var(--text-muted);">{{ formatDate(plan.generated_at) }}</div>
                <button class="btn btn-sm btn-outline" style="margin-top: 4px;" @click="viewPlanDetail(plan)">查看</button>
              </div>
            </div>
          </div>
          <div v-if="healthStore.planHistory.length === 0" style="text-align: center; padding: 48px; color: var(--text-muted);">
            <p>暂无历史计划</p><button class="btn btn-sm btn-primary" style="margin-top: 8px;" @click="generatePlan">生成首个计划</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showWeightModal" class="modal-overlay" @click.self="showWeightModal = false">
      <div class="modal-content">
        <div class="modal-header"><span class="modal-title">记录体重</span><button class="modal-close" @click="showWeightModal = false">x</button></div>
        <form @submit.prevent="submitWeight">
          <div class="form-group"><label class="form-label">体重 (kg)</label><input v-model="weightForm.weight" type="number" step="0.1" class="form-input" placeholder="请输入当前体重" required /></div>
          <div class="form-group"><label class="form-label">备注</label><input v-model="weightForm.note" class="form-input" placeholder="例如：晨起空腹" /></div>
          <button type="submit" class="btn btn-primary" style="width: 100%;">保存</button>
        </form>
      </div>
    </div>

    <div v-if="showPlanModal" class="modal-overlay" @click.self="showPlanModal = false">
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header"><span class="modal-title">{{ selectedPlan?.plan_month }} 计划详情</span><button class="modal-close" @click="showPlanModal = false">x</button></div>
        <div v-if="selectedPlan?.summary"><div style="padding: 16px; background: var(--primary-50); border-radius: var(--radius-sm); margin-bottom: 16px;"><p style="font-size: 0.9rem;">{{ selectedPlan.summary }}</p></div></div>
        <div style="text-align: center;"><button class="btn btn-primary" @click="$router.push('/report/' + selectedPlan?.plan_month)">查看完整月度报告</button></div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, inject } from "vue";
import AppLayout from "../components/AppLayout.vue";
import { useHealthStore } from "../store/health.js";

const healthStore = useHealthStore();
const showToast = inject("showToast");
const showWeightModal = ref(false);
const showPlanModal = ref(false);
const selectedPlan = ref(null);
const weightForm = ref({ weight: "", note: "" });

const visibleWeightRecords = computed(() => healthStore.weightRecords.slice(-14));
const minWeight = computed(() => { if (healthStore.weightRecords.length === 0) return 50; return Math.min(...healthStore.weightRecords.map((r) => r.weight)) - 2; });
const maxWeight = computed(() => { if (healthStore.weightRecords.length === 0) return 100; return Math.max(...healthStore.weightRecords.map((r) => r.weight)) + 2; });

const getBarHeight = (weight) => { const range = maxWeight.value - minWeight.value; if (range === 0) return 80; return ((weight - minWeight.value) / range) * 120 + 20; };
const weightBarColor = (record) => { const avg = healthStore.weightRecords.reduce((s, r) => s + r.weight, 0) / healthStore.weightRecords.length; if (record.weight < avg - 1) return "#10b981"; if (record.weight > avg + 1) return "#ef4444"; return "#f97316"; };
const formatDate = (dateStr) => { if (!dateStr) return ""; const d = new Date(dateStr); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const formatDateShort = (dateStr) => { if (!dateStr) return ""; const d = new Date(dateStr); return (d.getMonth() + 1) + "/" + d.getDate(); };

const submitWeight = async () => {
  if (!weightForm.value.weight) { showToast("请填写体重", "error"); return; }
  const result = await healthStore.recordWeight(weightForm.value);
  if (result.success) { showToast("体重记录成功", "success"); showWeightModal.value = false; weightForm.value = { weight: "", note: "" }; }
  else showToast(result.error, "error");
};

const viewPlanDetail = (plan) => { selectedPlan.value = plan; showPlanModal.value = true; };

const generatePlan = async () => {
  const result = await healthStore.generateMonthlyPlan();
  if (result.success) { showToast("计划已生成", "success"); await healthStore.loadPlanHistory(); }
  else showToast(result.error || "生成失败", "error");
};

onMounted(() => { healthStore.loadWeightRecords(); healthStore.loadPlanHistory(); });
</script>