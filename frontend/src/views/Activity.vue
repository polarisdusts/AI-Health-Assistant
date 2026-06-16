<template>
  <AppLayout>
    <div class="page-header">
      <div>
        <h1 class="page-title">运动</h1>
        <p class="page-subtitle">选择运动类型，开始你的训练</p>
      </div>
      <button v-if="!isTimerRunning" class="btn btn-primary btn-sm" @click="showPlanBar = !showPlanBar">
        {{ showPlanBar ? "隐藏计划" : "查看本月计划" }}
      </button>
    </div>

    <!-- 月度运动计划滚动条 -->
    <div v-if="showPlanBar" class="card" style="margin-bottom: 20px;">
      <div class="card-header">
        <span class="card-title">本月运动计划</span>
        <div style="display: flex; gap: 8px; align-items: center;">
          <button class="btn btn-sm btn-secondary" @click="scrollDay(-1)">&lt;</button>
          <span style="font-weight: 600; min-width: 60px; text-align: center;">第{{ currentDay }}天</span>
          <button class="btn btn-sm btn-secondary" @click="scrollDay(1)">&gt;</button>
        </div>
      </div>
      <div style="display: flex; gap: 6px; overflow-x: auto; padding: 8px 0 12px;">
        <div v-for="d in 30" :key="d" class="day-pill" :class="{ active: d === currentDay, rest: isRestDay(d) }" @click="currentDay = d" :title="getDayPlanTitle(d)">
          <div style="font-size: 0.75rem;">{{ d }}日</div>
          <div style="font-size: 0.6rem; opacity: 0.7;">{{ isRestDay(d) ? "休息" : getDayType(d) }}</div>
        </div>
      </div>
      <div v-if="currentDayPlan" style="padding: 12px; background: var(--primary-50); border-radius: var(--radius-sm);">
        <div style="font-weight: 600; color: var(--primary-700); margin-bottom: 4px;">第{{ currentDay }}天: {{ getDayType(currentDay) }}</div>
        <div style="font-size: 0.85rem; line-height: 1.6;">{{ currentDayPlan }}</div>
        <div style="margin-top: 6px; display: flex; gap: 12px;">
          <span style="font-size: 0.8rem; background: white; padding: 2px 10px; border-radius: 10px;">时长: {{ getDayDuration(currentDay) }}分钟</span>
          <span style="font-size: 0.8rem; background: white; padding: 2px 10px; border-radius: 10px;">消耗: ~{{ getDayCal(currentDay) }}千卡</span>
        </div>
      </div>
    </div>

    <!-- 运动类型选择 -->
    <div class="card" style="margin-bottom: 20px;">
      <div class="card-header">
        <span class="card-title">选择运动类型</span>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 10px;">
        <button
          v-for="t in activityTypes"
          :key="t.type"
          class="btn activity-type-btn"
          :class="selectedType === t.type ? 'btn-primary' : 'btn-secondary'"
          @click="selectType(t.type)"
          :disabled="isTimerRunning"
        >
          <span class="sport-icon" v-html="getSportIcon(t.type)"></span>
          <span class="sport-name">{{ t.name }}</span>
        </button>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <!-- 左边：运动控制 -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">{{ selectedType ? getTypeName(selectedType) : "请选择运动" }}</span>
        </div>

        <div v-if="selectedType" style="padding: 8px 0;">
          <!-- 路线选择（户外运动） -->
          <div v-if="isOutdoorType" class="form-group">
            <label class="form-label">运动路线</label>
            <select v-model="selectedRoute" class="form-select">
              <option value="">自由运动</option>
              <option v-for="r in savedRoutes" :key="r.name" :value="r.name">{{ r.name }} ({{ r.dist }}km)</option>
            </select>
          </div>

          <!-- 计时器 -->
          <div style="text-align: center; padding: 16px 0;">
            <div style="font-size: 3rem; font-weight: 700; font-family: monospace; color: var(--primary-600);">
              {{ formatTime(timerSeconds) }}
            </div>
            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">
              {{ isTimerRunning ? "运动进行中..." : (timerMode === "countdown" ? "倒计时模式" : "计时模式") }}
            </div>
          </div>

          <div v-if="!isTimerRunning" class="form-group">
            <label class="form-label">运动时长设定</label>
            <div style="display: flex; gap: 8px; align-items: center;">
              <input v-model.number="targetMinutes" type="number" class="form-input" min="0" max="120" style="width: 80px;" placeholder="分钟" />
              <span style="font-size: 0.85rem; color: var(--text-secondary);">分钟（0=自由计时）</span>
            </div>
          </div>

          <div v-if="showDistanceField && !isTimerRunning" class="form-group">
            <label class="form-label">预计距离 (公里)</label>
            <input v-model.number="targetDistance" type="number" step="0.1" class="form-input" placeholder="可选" />
          </div>

          <!-- 控制按钮 -->
          <div style="display: flex; gap: 12px;">
            <button v-if="!isTimerRunning" class="btn btn-primary btn-lg" style="flex: 1;" @click="startTimer">
              开始运动
            </button>
            <button v-if="isTimerRunning" class="btn btn-danger btn-lg" style="flex: 1;" @click="stopTimer">
              结束运动
            </button>
            <button v-if="isTimerRunning" class="btn btn-secondary" @click="pauseTimer">
              {{ isPaused ? "继续" : "暂停" }}
            </button>
          </div>
        </div>

        <div v-else style="text-align: center; padding: 32px 0; color: var(--text-muted);">
          <p>请先选择一种运动类型</p>
        </div>
      </div>

      <!-- 右边：AI分析 + 运动结果 -->
      <div>
        <!-- AI 分析 -->
        <div class="card" style="margin-bottom: 20px;">
          <div class="card-header">
            <span class="card-title">AI 实时分析</span>
          </div>
          <div v-if="aiAnalysis" style="padding: 8px 0;">
            <div style="padding: 16px; background: var(--primary-50); border-radius: var(--radius-sm);">
              <p style="font-size: 0.9rem; line-height: 1.6;">{{ aiAnalysis }}</p>
            </div>
          </div>
          <div v-else style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 0.85rem;">
            {{ isTimerRunning ? "运动数据采集中，结束后生成分析..." : "开始运动后这里会显示AI分析" }}
          </div>
        </div>

        <!-- 运动完成结果 -->
        <div v-if="lastResult" class="card">
          <div class="card-header">
            <span class="card-title">运动完成</span>
            <button class="btn btn-sm btn-secondary" @click="lastResult = null">关闭</button>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div style="padding: 12px; background: #f0fdf4; border-radius: 8px; text-align: center;">
              <div style="font-size: 0.75rem; color: var(--text-secondary);">时长</div>
              <div style="font-weight: 600; font-size: 1.1rem;">{{ lastResult.duration }}分钟</div>
            </div>
            <div style="padding: 12px; background: var(--primary-50); border-radius: 8px; text-align: center;">
              <div style="font-size: 0.75rem; color: var(--text-secondary);">消耗</div>
              <div style="font-weight: 600; font-size: 1.1rem;">{{ lastResult.calories }}千卡</div>
            </div>
            <div style="padding: 12px; background: #eff6ff; border-radius: 8px; text-align: center;">
              <div style="font-size: 0.75rem; color: var(--text-secondary);">步数</div>
              <div style="font-weight: 600; font-size: 1.1rem;">{{ lastResult.steps }}步</div>
            </div>
            <div style="padding: 12px; background: #fef3c7; border-radius: 8px; text-align: center;">
              <div style="font-size: 0.75rem; color: var(--text-secondary);">平均心率</div>
              <div style="font-weight: 600; font-size: 1.1rem;">{{ lastResult.avgHeartRate }}bpm</div>
            </div>
            <div style="padding: 12px; background: #ecfdf5; border-radius: 8px; text-align: center;">
              <div style="font-size: 0.75rem; color: var(--text-secondary);">步频</div>
              <div style="font-weight: 600; font-size: 1.1rem;">{{ lastResult.cadence }}步/分</div>
            </div>
            <div style="padding: 12px; background: #fff7ed; border-radius: 8px; text-align: center;">
              <div style="font-size: 0.75rem; color: var(--text-secondary);">平均速度</div>
              <div style="font-weight: 600; font-size: 1.1rem;">{{ lastResult.speed }}km/h</div>
            </div>
          </div>
          <div style="margin-top: 12px; text-align: center;">
            <span v-if="lastResult.mv" class="badge badge-mv" style="font-size: 0.85rem; padding: 4px 16px;">中高强度运动</span>
            <span v-if="lastResult.score" style="margin-left: 8px; padding: 4px 16px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; background: #f0fdf4; color: var(--success);">评分: {{ lastResult.score }}/100</span>
          </div>

          <!-- AI 运动建议 -->
          <div v-if="lastResult.aiFeedback" style="margin-top: 12px; padding: 16px; background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: var(--radius-sm);">
            <div style="font-weight: 600; margin-bottom: 4px;">下次优化建议</div>
            <p style="font-size: 0.85rem; line-height: 1.6;">{{ lastResult.aiFeedback }}</p>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, inject } from "vue";
import { useTimerStore } from "../store/timer.js";
import { useHealthStore } from "../store/health.js";
import { planAPI } from "../api/index.js";
import { getSportIcon } from "../utils/icons.js";
import AppLayout from "../components/AppLayout.vue";

const showToast = inject("showToast");

const aiAnalysis = ref("");

const timerStore = useTimerStore();
const healthStore = useHealthStore();

const selectedType = ref(null);
const lastResult = ref(null);
const showResult = ref(false);
const currentDay = ref(1);
const targetMinutes = ref(30);
const selectedRoute = ref("");
const targetDistance = ref(0);
const showPlanBar = ref(true);

const timerSeconds = computed(() => timerStore.seconds);
const isTimerRunning = computed(() => timerStore.isRunning);
const timerMode = computed(() => timerStore.mode);
const isPaused = computed(() => timerStore.isPaused);

// 检测倒计时归零自动触发 stopTimer
watch(() => timerStore.isRunning, (running) => {
  if (!running && timerStore.mode === "countdown" && timerStore.seconds === 0 && timerStore.targetMinutes > 0) {
    stopTimer();
  }
});

const savedRoutes = [
  { name: "沿江跑道", dist: 5.2 },
  { name: "公园环线", dist: 3.8 },
  { name: "城市绿道", dist: 8.5 },
  { name: "校园跑道", dist: 2.4 },
  { name: "滨江骑行道", dist: 12.0 },
];

const activityTypes = [
  { type: "outdoor_run", name: "户外跑步" },
  { type: "walking", name: "健走" },
  { type: "outdoor_cycle", name: "户外骑行" },
  { type: "indoor_run", name: "室内跑步" },
  { type: "jump_rope", name: "跳绳" },
  { type: "swimming", name: "游泳" },
  { type: "yoga", name: "瑜伽" },
  { type: "strength", name: "力量训练" },
  { type: "hiit", name: "HIIT间歇" },
  { type: "badminton", name: "羽毛球" },
  { type: "basketball", name: "篮球" },
  { type: "climbing", name: "攀岩" },
  { type: "boxing", name: "拳击" },
  { type: "dancing", name: "舞蹈" },
];

const isOutdoorType = computed(() => ["outdoor_run", "walking", "outdoor_cycle"].includes(selectedType.value));
const showDistanceField = computed(() => ["outdoor_run", "outdoor_cycle", "walking", "indoor_run"].includes(selectedType.value));

const getTypeName = (type) => { const t = activityTypes.find((a) => a.type === type); return t?.name || type; };
// 月度计划数据 - 优先从后端加载已保存的计划
const monthlyPlan = reactive({});
const planLoaded = ref(false);
const planTypes = ["有氧训练", "力量训练", "间歇训练", "恢复训练", "耐力训练", "柔韧训练", "综合训练"];
const planDescs = {
  "有氧训练": "中等强度持续有氧，保持心率在最大心率的65-75%，注意呼吸节奏和步频均匀。",
  "力量训练": "全身力量训练，重点锻炼核心肌群、上肢和下肢，每组8-12次，间歇45秒。",
  "间歇训练": "高强度间歇训练，30秒冲刺+90秒恢复，重复8轮，全面提升心肺能力。",
  "恢复训练": "低强度恢复运动，以拉伸和放松为主，促进肌肉修复，避免过度疲劳。",
  "耐力训练": "长时间低强度耐力训练，保持稳定配速，锻炼心肺耐力和肌肉持久力。",
  "柔韧训练": "瑜伽/普拉提为主的柔韧训练，提升关节活动度和肌肉延展性。",
  "综合训练": "结合多种训练模式的综合课，有氧+力量+柔韧全面覆盖。",
};

// 初始化默认计划（作为后备）
function initDefaultPlan() {
  for (let d = 1; d <= 30; d++) {
    const idx = d % 7;
    monthlyPlan[d] = {
      type: planTypes[idx],
      desc: planDescs[planTypes[idx]],
      duration: idx === 0 ? 40 : idx === 4 ? 50 : idx === 6 ? 30 : 35,
      cal: idx === 0 ? 320 : idx === 4 ? 400 : idx === 6 ? 180 : 280,
    };
  }
}

// 从后端加载详细计划
async function loadExercisePlan() {
  try {
    const { data } = await planAPI.getDetailedPlans();
    if (data && data.exerciseDays && data.exerciseDays.length >= 28) {
      for (const day of data.exerciseDays) {
        if (day.day >= 1 && day.day <= 30) {
          monthlyPlan[day.day] = {
            type: day.type || "运动",
            desc: day.advice || "",
            duration: day.duration || 30,
            cal: day.calories || 200,
          };
        }
      }
      planLoaded.value = true;
      return;
    }
  } catch (err) {
    console.warn("加载运动计划失败，使用默认计划:", err.message);
  }
  initDefaultPlan();
}
function getDayType(d) { return monthlyPlan[d]?.type || "休息"; }
function isRestDay(d) { return d % 7 === 6 || d % 7 === 0; }
function getDayDuration(d) { return monthlyPlan[d]?.duration || 0; }
function getDayCal(d) { return monthlyPlan[d]?.cal || 0; }

const currentDayPlan = computed(() => {
  const plan = monthlyPlan[currentDay.value];
  if (!plan) return "";
  return plan.desc + "\n推荐运动: " + ["慢跑", "快走", "游泳", "骑行", "瑜伽", "力量训练", "跳绳"][currentDay.value % 7] + ", 约" + plan.duration + "分钟";
});

function getDayPlanTitle(d) {
  const plan = monthlyPlan[d];
  return plan ? plan.type + " " + plan.duration + "分钟" : "休息日";
}

function scrollDay(dir) {
  const next = currentDay.value + dir;
  if (next >= 1 && next <= 30) currentDay.value = next;
}

function selectType(type) {
  if (timerStore.isRunning) return;
  selectedType.value = type;
  selectedRoute.value = "";
  lastResult.value = null;
  showResult.value = false;
  aiAnalysis.value = "";
}

// 计时器逻辑
const formatTime = (seconds) => timerStore.formatTime();

function startTimer() {
  if (timerStore.isRunning) return;
  if (selectedType.value === "outdoor_run" || selectedType.value === "walking" || selectedType.value === "outdoor_cycle") {
    // showDistanceField auto-computes from selectedType
  }
  // 默认30分钟倒计时
  const mins = targetMinutes.value > 0 ? targetMinutes.value : 30;
  targetMinutes.value = mins;
  timerStore.startTimer(selectedType.value, mins);
}


function pauseTimer() {
  timerStore.pauseTimer();
}


async function stopTimer() {
  const duration = Math.max(1, timerStore.getDurationMinutes());
  timerStore.stopTimer();
  showResult.value = true;
  if (duration < 1) { showToast("运动时间太短", "warning"); return; }
  const metaMap = {
    outdoor_run: { calPerMin: 9, stepsPerMin: 150, mv: true },
    walking: { calPerMin: 5, stepsPerMin: 120, mv: false },
    outdoor_cycle: { calPerMin: 7, stepsPerMin: 90, mv: true },
    indoor_run: { calPerMin: 8, stepsPerMin: 140, mv: true },
    jump_rope: { calPerMin: 10, stepsPerMin: 160, mv: true },
    swimming: { calPerMin: 8, stepsPerMin: 60, mv: true },
    yoga: { calPerMin: 3, stepsPerMin: 40, mv: false },
    strength: { calPerMin: 6, stepsPerMin: 30, mv: true },
    hiit: { calPerMin: 11, stepsPerMin: 130, mv: true },
    badminton: { calPerMin: 7, stepsPerMin: 100, mv: true },
    basketball: { calPerMin: 8, stepsPerMin: 120, mv: true },
    climbing: { calPerMin: 9, stepsPerMin: 50, mv: true },
    boxing: { calPerMin: 10, stepsPerMin: 100, mv: true },
    dancing: { calPerMin: 5, stepsPerMin: 80, mv: true },
    basketball: { calPerMin: 8, stepsPerMin: 120, mv: true },
    climbing: { calPerMin: 9, stepsPerMin: 50, mv: true },
    boxing: { calPerMin: 10, stepsPerMin: 100, mv: true },
    dancing: { calPerMin: 5, stepsPerMin: 80, mv: true },
  };
  const typeName = { outdoor_run: "户外跑步", walking: "健走", outdoor_cycle: "户外骑行", indoor_run: "室内跑步", jump_rope: "跳绳", swimming: "游泳", yoga: "瑜伽", strength: "力量训练", hiit: "HIIT间歇", badminton:"羽毛球", basketball:"篮球", climbing:"攀岩", boxing:"拳击", dancing:"舞蹈" }[selectedType.value] || "运动";
  const meta = metaMap[selectedType.value] || { calPerMin: 6, stepsPerMin: 80, mv: false };
  const calories = Math.round(meta.calPerMin * duration);
  const steps = Math.round(meta.stepsPerMin * duration);
  const avgHeartRate = Math.round(120 + Math.random() * 30);
  const cadence = Math.round(meta.stepsPerMin * (0.8 + Math.random() * 0.4));
  const speed = selectedType.value === "outdoor_cycle" ? (15 + Math.random() * 10).toFixed(1)
    : selectedType.value === "outdoor_run" ? (8 + Math.random() * 4).toFixed(1)
    : selectedType.value === "walking" ? (4 + Math.random() * 2).toFixed(1)
    : "N/A";
  const score = Math.round(Math.min(100, 40 + (duration / 60) * 30 + Math.random() * 30));
  
    lastResult.value = { duration, calories, steps, score, heartRate: avgHeartRate, cadence, speed, isMV: meta.mv };
  try {
    const res = await fetch("/api/activity/ai-analysis", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        typeName: typeName,
        duration: duration,
        calories: calories,
        steps: steps,
        avgHeartRate: avgHeartRate,
        cadence: cadence,
        isMV: meta.mv,
        score: score
      })
    });
    const data = await res.json();
    aiAnalysis.value = data.analysis || "AI分析暂时不可用";
  } catch(e) {
    console.error('AI analyze error:', e);
    aiAnalysis.value = "AI分析暂时不可用，请稍后再试";
  }
// 保存到后端，recordActivity 内部自动调用 loadCurrentSummary
  await healthStore.recordActivity({
    activity_type: selectedType.value,
    duration: duration,
    distance: selectedType.value === "outdoor_run" || selectedType.value === "walking" || selectedType.value === "outdoor_cycle" ? parseFloat(speed) : null
  });
  showToast("运动完成！" + duration + "分钟/消耗" + calories + "千卡", "success");  
}
onMounted(() => { healthStore.loadActivityTypes(); healthStore.loadCurrentSummary(); loadExercisePlan(); });
// Timer is managed globally, no cleanup needed
</script>

<style scoped>
.activity-type-btn {
  flex-direction: column;
  padding: 14px 8px;
  height: auto;
  gap: 6px;
}
.sport-icon {
  display: inline-flex;
  width: 32px;
  height: 32px;
  color: inherit;
}
.sport-icon svg { width: 100%; height: 100%; }
.sport-name { font-size: 0.8rem; font-weight: 500; }

.day-pill {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  padding: 6px 8px;
  border-radius: 10px;
  background: var(--gray-100);
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s;
}
.day-pill.active { background: var(--primary-500); color: white; }
.day-pill.rest { background: #fef3c7; color: #92400e; }
.day-pill:hover:not(.active) { background: var(--gray-200); }
</style>



