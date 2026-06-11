<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
      <!-- Header -->
      <div class="modal-header">
        <span class="modal-title">{{ stepTitles[step] }}</span>
        <button class="modal-close" @click="$emit('close')">x</button>
      </div>

      <!-- Step 1: Choose plan type -->
      <div v-if="step === 1" style="text-align: center; padding: 24px 0;">
        <p style="font-size: 1rem; margin-bottom: 24px;">请选择要生成的计划类型</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <button class="btn plan-type-card" @click="selectExercisePlan">
            <span style="font-size: 2rem;">A</span>
            <span style="font-size: 1.1rem; font-weight: 600;">运动计划</span>
            <span style="font-size: 0.85rem; color: var(--text-muted);">基于身体状况定制运动方案</span>
          </button>
          <button class="btn plan-type-card" @click="selectDietPlan">
            <span style="font-size: 2rem;">D</span>
            <span style="font-size: 1.1rem; font-weight: 600;">饮食计划</span>
            <span style="font-size: 0.85rem; color: var(--text-muted);">控糖/减脂/增肌等饮食建议</span>
          </button>
        </div>
      </div>

      <!-- Step 2: Exercise - Previous evaluation + intensity -->
      <div v-if="step === 2 && planType === 'exercise'" style="padding: 8px 0;">
        <div style="padding: 16px; background: var(--primary-50); border-radius: var(--radius-sm); margin-bottom: 20px;">
          <div style="font-weight: 600; color: var(--primary-700); margin-bottom: 8px;">上期计划评价</div>
          <p style="font-size: 0.9rem; line-height: 1.6;">{{ previousEval }}</p>
        </div>
        <div class="form-group">
          <label class="form-label">上期运动强度调整</label>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-top: 8px;">
            <button class="btn" :class="intensity === 'down' ? 'btn-primary' : 'btn-secondary'" @click="intensity = 'down'">减弱强度</button>
            <button class="btn" :class="intensity === 'keep' ? 'btn-primary' : 'btn-secondary'" @click="intensity = 'keep'">保持计划</button>
            <button class="btn" :class="intensity === 'up' ? 'btn-primary' : 'btn-secondary'" @click="intensity = 'up'">加强锻炼</button>
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 20px;">
          <button class="btn btn-secondary" @click="step = 1">上一步</button>
          <button class="btn btn-primary" @click="step = 3">下一步</button>
        </div>
      </div>

      <!-- Step 3: Exercise - Select types with hover -->
      <div v-if="step === 3 && planType === 'exercise'" style="padding: 8px 0;">
        <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 16px;">选择至少两项运动类型（悬停查看详情）</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px;">
          <div
            v-for="t in exerciseTypes" :key="t.type"
            class="btn exercise-select-card"
            :class="{ selected: selectedTypes.includes(t.type), 'btn-primary': selectedTypes.includes(t.type), 'btn-secondary': !selectedTypes.includes(t.type) }"
            @click="toggleType(t.type)"
            @mouseenter="hoverType = t.type"
            @mouseleave="hoverType = null"
          >
            <span style="font-size: 0.9rem;">{{ t.name }}</span>
            <!-- Hover tooltip -->
            <div v-if="hoverType === t.type" class="hover-tip">
              <div style="font-weight: 600; margin-bottom: 4px;">{{ t.name }}</div>
              <div style="font-size: 0.8rem;">{{ t.aiTip }}</div>
            </div>
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 20px;">
          <button class="btn btn-secondary" @click="step = 2">上一步</button>
          <button class="btn btn-primary" @click="confirmExerciseTypes" :disabled="selectedTypes.length < 2">下一步 (已选{{ selectedTypes.length }})</button>
        </div>
      </div>

      <!-- Step 4: Exercise - Detailed daily plan -->
      <div v-if="step === 4 && planType === 'exercise'" style="padding: 8px 0;">
        <div style="background: linear-gradient(135deg, var(--primary-50), var(--primary-100)); border-radius: var(--radius-sm); padding: 20px; margin-bottom: 16px;">
          <div style="font-weight: 700; font-size: 1.1rem; margin-bottom: 8px;">本月运动计划</div>
          <p style="font-size: 0.9rem; line-height: 1.6;">{{ fullPlan.summary }}</p>
        </div>

        <div class="tabs" style="margin-bottom: 12px;">
          <button v-for="w in 4" :key="w" class="tab" :class="{ active: currentWeek === w }" @click="currentWeek = w">第{{ w }}周</button>
        </div>

        <div v-for="day in weekDays" :key="day" style="padding: 10px 0; border-bottom: 1px solid var(--gray-100);">
          <div style="font-weight: 600; color: var(--primary-600); margin-bottom: 4px;">第{{ ((currentWeek - 1) * 7 + day) }}天</div>
          <div style="font-size: 0.85rem; line-height: 1.5;">
            <div>{{ getDayPlan((currentWeek - 1) * 7 + day) }}</div>
            <div style="margin-top: 4px;">
              <span class="badge badge-mv" style="margin-right: 8px;">{{ getDayDuration((currentWeek - 1) * 7 + day) }}分钟</span>
              <span class="badge badge-mv" style="background: var(--primary-50); color: var(--primary-700);">消耗 ~{{ getDayCalories((currentWeek - 1) * 7 + day) }}千卡</span>
            </div>
          </div>
        </div>

        <button class="btn btn-primary btn-lg" style="width: 100%; margin-top: 20px;" @click="finishPlan">完成运动计划</button>
      </div>

      <!-- Step 2: Diet - Goal selection -->
      <div v-if="step === 2 && planType === 'diet'" style="padding: 8px 0;">
        <div style="padding: 16px; background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: var(--radius-sm); margin-bottom: 20px;">
          <div style="font-weight: 600; margin-bottom: 8px;">AI 饮食建议</div>
          <p style="font-size: 0.9rem;">根据你的身体状况（BMI: {{ userBMI }}），建议关注以下方向：</p>
        </div>
        <div class="form-group">
          <label class="form-label">选择饮食目标</label>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 8px;">
            <button v-for="g in dietGoals" :key="g.key" class="btn" :class="dietGoal === g.key ? 'btn-primary' : 'btn-secondary'" style="flex-direction: column; padding: 16px; height: auto;" @click="dietGoal = g.key">
              <span style="font-weight: 600;">{{ g.label }}</span>
              <span style="font-size: 0.8rem; color: var(--text-muted);">{{ g.desc }}</span>
            </button>
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 20px;">
          <button class="btn btn-secondary" @click="step = 1">上一步</button>
          <button class="btn btn-primary" @click="generateDietPlan" :disabled="!dietGoal">生成饮食计划</button>
        </div>
      </div>

            <!-- Step 3: Diet - Detailed plan simplified -->
      <div v-if="step === 3 && planType === 'diet'" style="padding: 8px 0;">
        <div style="background: linear-gradient(135deg, #f0fdf4, #ecfdf5); border-radius: var(--radius-sm); padding: 20px; margin-bottom: 16px;">
          <div style="font-weight: 700; font-size: 1.1rem; margin-bottom: 8px;">{{ dietGoalLabel }} 饮食方案</div>
          <p style="font-size: 0.9rem;">每日建议摄入: <strong>{{ dietPlanData.dailyCalories || '' }}</strong></p>
        </div>

        <div v-if="dietPlanDays && Object.keys(dietPlanDays).length > 0">
          <div style="display: flex; gap: 4px; overflow-x: auto; padding: 8px 0 12px;">
            <div v-for="d in 30" :key="d"
              @click="currentDietDay = d"
              style="display: inline-flex; align-items: center; justify-content: center; min-width: 34px; height: 34px; border-radius: 50%; font-size: 0.8rem; cursor: pointer; flex-shrink: 0; transition: all 0.2s;"
              :style="{ background: d === currentDietDay ? 'var(--primary-500)' : 'var(--gray-100)', color: d === currentDietDay ? 'white' : 'var(--text-primary)' }">
              {{ d }}
            </div>
          </div>

          <div v-if="currentDayMeals" style="margin-top: 12px;">
            <div style="padding: 16px; background: var(--gray-50); border-radius: var(--radius-sm);">
              <div style="font-weight: 600; color: var(--primary-600); margin-bottom: 8px;">第{{ currentDietDay }}天 饮食安排</div>
              <div v-for="(meal, key) in currentDayMeals" :key="key" style="padding: 8px 0; border-bottom: 1px solid var(--gray-200);">
                <div style="font-weight: 500; font-size: 0.9rem;">{{ mealLabels[key] }}</div>
                <div style="font-size: 0.85rem; line-height: 1.5;">{{ meal.food }}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
                  热量 {{ meal.cal }}千卡 | 蛋白 {{ meal.protein }}g | 碳水 {{ meal.carbs }}g | 脂肪 {{ meal.fat }}g
                </div>
              </div>
              <div v-if="currentDietDay % 7 === 0" style="margin-top: 8px; padding: 8px 12px; background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 8px; font-size: 0.8rem;">
                AI 评价: 本周饮食计划执行良好，建议注意蛋白质摄入的分散性，每餐均衡搭配。
              </div>
            </div>
          </div>
        </div>
        <div v-else style="text-align: center; padding: 24px; color: var(--text-muted);">
          <div class="loading-spinner" style="margin: 0 auto;"></div>
          <p style="margin-top: 8px;">正在生成饮食计划...</p>
        </div>

        <button class="btn btn-primary btn-lg" style="width: 100%; margin-top: 20px;" @click="finishPlan">完成饮食计划</button>
      </div>
      <!-- Loading -->
      <div v-if="loading" class="loading-overlay"><div class="loading-spinner"></div></div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, reactive } from "vue";
import { planAPI } from "../api/index.js";

const emit = defineEmits(["close", "complete"]);
const props = defineProps({
  userProfile: { type: Object, default: () => ({}) },
  previousActivities: { type: Array, default: () => [] },
  previousPlan: { type: Object, default: null },
});

const step = ref(1);
const planType = ref(null);
const loading = ref(false);
const intensity = ref("keep");
const selectedTypes = ref([]);
const hoverType = ref(null);
const currentWeek = ref(1);
const dietGoal = ref("");

const stepTitles = {
  1: "选择计划类型",
  2: "计划配置",
  3: "选择运动类型",
  4: "详细计划",
};

const previousEval = computed(() => {
  const activityCount = props.previousActivities?.length || 0;
  const totalCal = props.previousActivities?.reduce((s, a) => s + (a.calories_burned || 0), 0) || 0;
  if (activityCount === 0) return "上期暂无运动记录，建议从温和运动开始建立习惯。";
  if (activityCount < 5) return "上期运动" + activityCount + "次，消耗" + totalCal + "千卡，运动频率偏低，建议适当增加。";
  if (activityCount < 15) return "上期运动" + activityCount + "次，消耗" + totalCal + "千卡，运动习惯良好，有提升空间。";
  return "上期运动" + activityCount + "次，消耗" + totalCal + "千卡，运动表现优秀，可以挑战更高强度！";
});

const userBMI = computed(() => {
  const u = props.userProfile;
  if (!u.height || !u.weight) return "未知";
  const h = u.height / 100;
  return (u.weight / (h * h)).toFixed(1);
});

const exerciseTypes = [
  { type: "outdoor_run", name: "户外跑步", aiTip: "适合提升心肺耐力，燃脂效率高。推荐晨跑或傍晚，注意充分热身。根据您的身体状况，建议每次20-40分钟。" },
  { type: "walking", name: "健走", aiTip: "低强度有氧，适合恢复日和初学者。每天30分钟可有效改善代谢和情绪。" },
  { type: "outdoor_cycle", name: "户外骑行", aiTip: "对膝关节友好，适合长时间有氧训练。建议保持均匀踏频，每周2-3次。" },
  { type: "indoor_run", name: "室内跑步", aiTip: "不受天气影响，可精确控制配速。适合间歇训练提升心肺功能。" },
  { type: "jump_rope", name: "跳绳", aiTip: "高效燃脂运动，10分钟≈跑步30分钟。注意落地缓冲，建议分组训练。" },
  { type: "swimming", name: "游泳", aiTip: "全身性运动，对关节零压力。适合交叉训练和恢复日的积极恢复。" },
  { type: "yoga", name: "瑜伽", aiTip: "提升柔韧性与核心力量，缓解运动疲劳。适合作为补充训练和冥想。" },
  { type: "strength", name: "力量训练", aiTip: "增肌塑形，提升基础代谢。建议分化训练各肌群，每周3-4次。" },
  { type: "hiit", name: "HIIT 间歇", aiTip: "高强度间歇训练，后燃效应强。时间短效率高，适合忙碌但想高效燃脂的用户。" },
  { type: "badminton", name: "羽毛球", aiTip: "全身协调运动，提升反应速度和爆发力。建议每周2-3次，注意热身。" },
];

const dietGoals = [
  { key: "sugar_control", label: "控糖", desc: "控制血糖波动" },
  { key: "fat_loss", label: "减脂", desc: "降低体脂率" },
  { key: "muscle_gain", label: "增肌", desc: "增加肌肉量" },
  { key: "weight_gain", label: "增重", desc: "健康增重" },
  { key: "weight_loss", label: "减肥", desc: "整体减重" },
  { key: "maintain", label: "维持健康", desc: "均衡营养维持" },
];

const mealLabels = { breakfast: "早餐", lunch: "午餐", dinner: "晚餐", snack: "加餐" };

const dietPlanData = ref({});
const currentDietDay = ref(1);
const dietPlanDays = ref({});
const dietPlan = ref({
  dailyCalories: "",
  protein: "",
  carbs: "",
  fat: "",
  meals: {
    breakfast: { food: "", calories: "", protein: "", carbs: "", fat: "", sugar: "" },
    lunch: { food: "", calories: "", protein: "", carbs: "", fat: "", sugar: "" },
    dinner: { food: "", calories: "", protein: "", carbs: "", fat: "", sugar: "" },
    snack: { food: "", calories: "", protein: "", carbs: "", fat: "", sugar: "" },
  },
  supplements: "",
});

const dietGoalLabel = computed(() => {
  const g = dietGoals.find((d) => d.key === dietGoal.value);
  return g ? g.label : "";
});

const currentDayMeals = computed(() => dietPlanDays.value[currentDietDay.value] || null);

const fullPlan = reactive({
  summary: "根据您的身体指标和运动偏好，为您定制了为期一个月的渐进式运动计划。每周安排3-5次运动，包含有氧训练、力量训练和恢复日，逐步提升运动能力。",
  days: [],
});

const weekDays = computed(() => {
  const w = currentWeek.value;
  return w === 4 ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : [1, 2, 3, 4, 5, 6, 7];
});

function toggleType(type) {
  const idx = selectedTypes.value.indexOf(type);
  if (idx >= 0) selectedTypes.value.splice(idx, 1);
  else selectedTypes.value.push(type);
}

function selectExercisePlan() {
  planType.value = "exercise";
  step.value = 2;
}

function selectDietPlan() {
  planType.value = "diet";
  step.value = 2;
}

async function confirmExerciseTypes() {
  loading.value = true;
  await generateExercisePlan();
  step.value = 4;
  loading.value = false;
}

const typeNameMap = {
  outdoor_run: "户外跑步", walking: "健走", outdoor_cycle: "户外骑行",
  indoor_run: "室内跑步", jump_rope: "跳绳", swimming: "游泳",
  yoga: "瑜伽", strength: "力量训练", hiit: "HIIT间歇训练", badminton: "羽毛球"
};

const sportAdviceMap = {
  outdoor_run: "保持心率140-160bpm，注意落地缓冲",
  walking: "步频120步/分钟以上，自然摆臂",
  outdoor_cycle: "踏频80-90rpm，注意呼吸节奏",
  indoor_run: "设置坡度1-2%，控制步频",
  jump_rope: "分组训练每组2分钟间歇30秒",
  swimming: "注意呼吸节奏，自由泳和蛙泳交替",
  yoga: "关注呼吸与身体的连接，每个体式保持5-8个呼吸",
  strength: "分化训练各肌群，每组8-12次",
  hiit: "高强度30秒+休息15秒，循环8-12轮",
  badminton: "注意脚步移动和核心发力"
};

const typeNameRev = {
  "户外跑步": "outdoor_run", "健走": "walking", "户外骑行": "outdoor_cycle",
  "室内跑步": "indoor_run", "跳绳": "jump_rope", "游泳": "swimming",
  "瑜伽": "yoga", "力量训练": "strength", "HIIT间歇训练": "hiit", "羽毛球": "badminton"
};

function getDayPlan(day) {
  if (fullPlan.days[day]) return fullPlan.days[day].plan;
  const types = selectedTypes.value.length > 0 ? selectedTypes.value : ["outdoor_run", "walking"];
  const tIdx = day % types.length;
  const tName = typeNameMap[types[tIdx]] || "有氧运动";
  return "第" + day + "天: " + tName + (day % 7 === 0 ? "（恢复日，低强度）" : day % 3 === 0 ? "（中等强度）" : "（常规训练）");
}

function getDayDuration(day) {
  if (day % 7 === 0) return 20 + Math.floor(Math.random() * 10);
  if (day % 3 === 0) return 35 + Math.floor(Math.random() * 15);
  return 25 + Math.floor(Math.random() * 15);
}

function getDayCalories(day) {
  const dur = getDayDuration(day);
  return Math.round(dur * (6 + Math.random() * 3));
}
async function generateExercisePlan() {
  try {
    const { data } = await planAPI.generateDetailedExercise({ selectedTypes: selectedTypes.value });
    if (data && data.days && data.days.length >= 28) {
      const apiDays = data.days;
      const ap = props.previousActivities || [];
      const totalCal = ap.reduce((s, a) => s + (a.calories_burned || 0), 0);
      const ac = ap.length;
      fullPlan.summary = "AI根据您的身体状况和选择的运动类型定制了本月30天运动计划。"
        + "累计运动" + ac + "次，消耗" + totalCal + "千卡。"
        + "训练强度: " + (intensity.value === "up" ? "加强" : intensity.value === "down" ? "减弱" : "保持")
        + "。建议循序渐进，注意运动前后的拉伸与恢复。";
      fullPlan.days = [];
      for (let d = 1; d <= 30; d++) {
        const idx = (d - 1) % apiDays.length;
        const dd = apiDays[idx];
        const eng = typeNameRev[dd.type] || "outdoor_run";
        const adv = dd.advice || sportAdviceMap[eng] || "量力而行，注意补充水分";
        const isHigh = dd.isHighIntensity || false;
        const txt = "第" + d + "天: " + dd.type + (isHigh ? "（高强度）" : "") + " | " + dd.duration + "分钟 | ~" + dd.calories + "千卡\n" + "建议: " + adv;
        fullPlan.days[d] = { plan: txt, duration: dd.duration, calories: dd.calories, isHighIntensity: isHigh };
      }
      return;
    }
  } catch (err) {
    console.warn("AI API 运动计划失败，使用本地模拟:", err.message);
  }

  const types = selectedTypes.value.length > 0 ? selectedTypes.value : ["outdoor_run", "walking"];
  const ac = props.previousActivities?.length || 0;
  const freq = ac < 3 ? "每周3次" : ac < 10 ? "每周4次" : "每周5次";
  const lvl = ac === 0 ? "初学者" : ac < 8 ? "入门" : ac < 15 ? "进阶级" : "优秀";
  fullPlan.summary = "基于您的身体状况和选择的运动类型定制。运动水平: " + lvl + "(累计" + ac + "次) | 训练强度: "
    + (intensity.value === "up" ? "加强" : intensity.value === "down" ? "减弱" : "保持")
    + "。建议" + freq + "，循序渐进。";
  fullPlan.days = [];
  for (let d = 1; d <= 30; d++) {
    const wd = d % 7;
    const wn = Math.ceil(d / 7);
    const si = (d - 1) % types.length;
    const ts = types[si];
    const sn = typeNameMap[ts] || "有氧运动";
    const ir = wd === 0 || wd === 6;
    let bd = ir ? 15 : (d % 3 === 0 ? 35 : 25);
    if (intensity.value === "up") bd = Math.round(bd * 1.2);
    else if (intensity.value === "down") bd = Math.round(bd * 0.8);
    const dur = bd + Math.floor(Math.random() * 5);
    const cal = Math.round(dur * (6 + Math.random() * 3));
    const adv = sportAdviceMap[ts] || "量力而行，注意补充水分";
    const txt = "第" + d + "天: " + sn + (ir ? "（恢复）" : "")
      + " | " + dur + "分钟 | ~" + cal + "千卡"
      + "建议: " + adv
      + "阶段: " + (ir ? "低强度恢复" : wn <= 1 ? "适应阶段" : wn <= 2 ? "基础阶段" : wn <= 3 ? "提升阶段" : "冲刺阶段");
    fullPlan.days[d] = { plan: txt, duration: dur, calories: cal };
  }
}

async function generateDietPlan() {
  if (!dietGoal.value) return;
  loading.value = true;
  currentDietDay.value = 1;
  try {
    const { data } = await planAPI.generateMonthly();
    if (data && data.plan && data.plan.diet_plan) {
      const dp = data.plan.diet_plan;
      dietPlanData.value = {
        dailyCalories: dp.daily_calories || "根据用户数据计算中",
        protein: dp.protein || "按需调整",
        carbs: dp.carbs || "按需调整",
        fat: dp.fat || "按需调整",
        meals: dp.meals || {},
        supplements: (dp.supplements || []).join("\n") || (dp.recommended_foods ? "推荐食物: " + dp.recommended_foods.join("、") : ""),
      };
      const mealFoods = [dp.meals?.breakfast || "", dp.meals?.lunch || "", dp.meals?.dinner || "", dp.meals?.snack || ""];
      const dailyPlans = [];
      for (let v = 0; v < 3; v++) {
        dailyPlans.push({
          breakfast: { food: v === 0 ? mealFoods[0] : (dp.meals?.breakfast || "按计划调整"), cal: Math.round(parseInt(dp.daily_calories || "1800") * (0.25 + v * 0.02)), protein: 20 + v * 5, carbs: 35 + v * 5, fat: 8 + v * 2, sugar: 4 },
          lunch: { food: v === 0 ? mealFoods[1] : (dp.meals?.lunch || "按计划调整"), cal: Math.round(parseInt(dp.daily_calories || "1800") * (0.35 - v * 0.02)), protein: 30 - v * 3, carbs: 40 - v * 3, fat: 12 - v * 2, sugar: 5 },
          dinner: { food: v === 0 ? mealFoods[2] : (dp.meals?.dinner || "按计划调整"), cal: Math.round(parseInt(dp.daily_calories || "1800") * 0.25), protein: 25, carbs: 30, fat: 10, sugar: 3 },
          snack: { food: dp.meals?.snack || "按需加餐", cal: 120, protein: 5, carbs: 20, fat: 3, sugar: 3 },
        });
      }
      for (let d = 1; d <= 30; d++) { dietPlanDays.value[d] = dailyPlans[d % 3]; }
      step.value = 3;
      loading.value = false;
      return;
    }
  } catch (err) {
    console.warn("AI API生成饮食计划失败:", err);
  }
  // 回退方案: 根据用户目标生成默认饮食计划
  const goalCalMap = { sugar_control: "1600-1800", fat_loss: "1400-1600", muscle_gain: "2200-2500", weight_gain: "2500-2800", weight_loss: "1200-1500", maintain: "1800-2000" };
  const goalDescMap = { sugar_control: "控糖饮食", fat_loss: "减脂饮食", muscle_gain: "增肌饮食", weight_gain: "增重饮食", weight_loss: "减肥饮食", maintain: "均衡饮食" };
  dietPlanData.value = { dailyCalories: goalCalMap[dietGoal.value] || "1800-2000", meals: {}, supplements: "建议多吃新鲜蔬菜水果，减少高糖高油食物" };
  const fallbackMeals = {
    sugar_control: { breakfast: "全麦面包+鸡蛋+牛奶", lunch: "杂粮饭+鸡胸肉+清炒蔬菜", dinner: "蔬菜沙拉+豆腐+小量粗粮", snack: "坚果或酸奶" },
    fat_loss: { breakfast: "蒸玉米+鸡蛋+豆浆", lunch: "粗粮饭+熟鱼+清炒芹菜", dinner: "蔬菜汤+白切鸡胸肉+小吐司", snack: "苹果或黄瓜" },
    muscle_gain: { breakfast: "燕麦片+牛奶+鸡蛋+香蕉", lunch: "米饭+牛肉+西兰花+豆制品", dinner: "累米饭+鱼肉+薯叶菜", snack: "核桃+腿肉+高蛋白饮料" },
    weight_gain: { breakfast: "花生酥+牛奶+鸡蛋+糖心", lunch: "米饭+红烧肉+土豆焯牛奶", dinner: "面条+煮鸡蛋+红粕", snack: "巧克力+蛋糕+坚果" },
    weight_loss: { breakfast: "蒸薯+鸡蛋+脱脂牛奶", lunch: "杂粮饭+白切鸡+蒿子炒松子", dinner: "小米粥+清蒸鱼+白燕花", snack: "火龙果或凝酶" },
    maintain: { breakfast: "窗市早餐栒，蛋奶配合粗粮", lunch: "珠宝饭+炒菜+汤", dinner: "清淡主义，少油少盐", snack: "水果或酸奶" }
  };
  const dayGoals = { sugar_control: "控制添加糖摑取<25g/天", fat_loss: "减少油脂摑取<50g/天", muscle_gain: "蛋白质摄取>120g/天", weight_gain: "每日超过500卡目标", weight_loss: "减少米面主食摄取", maintain: "各类营养均衡摄取" };
  const m = fallbackMeals[dietGoal.value] || fallbackMeals.maintain;
  for (let d = 1; d <= 30; d++) {
    const variant = d % 3;
    const extraFoods = ["+水果", "+坪果", "+豆腐", "+滥颗", "+芽菜", ""][d % 6];
    dietPlanDays.value[d] = {
      breakfast: { food: m.breakfast + (variant === 0 ? extraFoods : ""), cal: 320 + variant * 30, protein: 18 + variant * 3, carbs: 40 + variant * 5, fat: 8, sugar: 5 },
      lunch: { food: m.lunch + (variant === 1 ? extraFoods : ""), cal: 520 + variant * 20, protein: 28 + variant * 4, carbs: 50 + variant * 3, fat: 14, sugar: 6 },
      dinner: { food: m.dinner + (variant === 2 ? extraFoods : ""), cal: 380 + variant * 10, protein: 22 + variant * 2, carbs: 35 + variant * 4, fat: 10, sugar: 4 },
      snack: { food: m.snack, cal: 130, protein: 6, carbs: 18, fat: 5, sugar: 4 },
    };
  }
  step.value = 3;
  loading.value = false;
}function getDietDayTotal(day) {
  const meals = dietPlanDays.value[day];
  if (!meals) return "";
  let cal = 0, pro = 0, carbs = 0, fat = 0, sugar = 0;
  Object.values(meals).forEach(m => { cal += m.cal; pro += m.protein; carbs += m.carbs; fat += m.fat; sugar += m.sugar; });
  return "热量" + cal + "千卡 | 蛋白质" + pro + "g | 碳水" + carbs + "g | 脂肪" + fat + "g | 糖" + sugar + "g";
}

function finishPlan() {
  emit("complete", { type: planType.value, intensity: intensity.value, types: selectedTypes.value, dietGoal: dietGoal.value });
}
</script>
<style scoped>
.plan-type-card {
  flex-direction: column;
  padding: 32px 24px;
  height: auto;
  gap: 8px;
  background: var(--card-bg);
  border: 2px solid var(--gray-200);
  transition: all 0.3s ease;
}
.plan-type-card:hover {
  border-color: var(--primary-400);
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
.exercise-select-card {
  position: relative;
  flex-direction: column;
  padding: 20px 12px;
  height: auto;
  min-height: 60px;
}
.hover-tip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--gray-800);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 0.85rem;
  width: auto;
  min-width: 200px;
  max-width: 320px;
  white-space: normal;
  word-wrap: break-word;
  text-align: left;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  pointer-events: none;
}
.hover-tip::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: var(--gray-800);
}
</style>