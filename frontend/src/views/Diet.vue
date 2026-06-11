<template>
  <AppLayout>
    <div class="page-header">
      <div>
        <h1 class="page-title">饮食管理</h1>
        <p class="page-subtitle">记录每日饮食，追踪营养摄入</p>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="btn btn-outline btn-sm" @click="showPlan = !showPlan">
          {{ showPlan ? "关闭计划" : "查看饮食计划" }}
        </button>
      </div>
    </div>

    <!-- 每日饮食计划（顶部可滚动） -->
    <div v-if="showPlan && dietPlanData" class="card" style="margin-bottom: 20px;">
      <div class="card-header">
        <span class="card-title">本月饮食计划</span>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-sm btn-secondary" @click="scrollPlan(-1)">‹</button>
          <span style="font-weight: 600; padding: 4px 8px;">第{{ currentPlanDay }}天</span>
          <button class="btn btn-sm btn-secondary" @click="scrollPlan(1)">›</button>
        </div>
      </div>
      <div style="display: flex; gap: 12px; overflow-x: auto; padding: 8px 0;">
        <div v-for="d in 30" :key="d" class="plan-day-pill" :class="{ active: d === currentPlanDay }" @click="currentPlanDay = d">
          {{ d }}
        </div>
      </div>
      <div v-if="currentDayPlan" style="margin-top: 12px; padding: 16px; background: var(--primary-50); border-radius: var(--radius-sm);">
        <div style="font-weight: 600; color: var(--primary-700); margin-bottom: 8px;">第{{ currentPlanDay }}天 饮食方案</div>
        <div style="font-size: 0.85rem; line-height: 1.6; white-space: pre-wrap;">{{ currentDayPlan }}</div>
        <div style="margin-top: 8px; display: flex; gap: 16px; flex-wrap: wrap;">
          <span style="font-size: 0.8rem; background: white; padding: 4px 12px; border-radius: 12px;">热量: {{ currentDayCal }}千卡</span>
          <span style="font-size: 0.8rem; background: white; padding: 4px 12px; border-radius: 12px;">蛋白: {{ currentDayProtein }}g</span>
          <span style="font-size: 0.8rem; background: white; padding: 4px 12px; border-radius: 12px;">碳水: {{ currentDayCarbs }}g</span>
          <span style="font-size: 0.8rem; background: white; padding: 4px 12px; border-radius: 12px;">脂肪: {{ currentDayFat }}g</span>
        </div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <!-- 左侧：今日饮食记录 -->
      <div>
        <div class="card" style="margin-bottom: 20px;">
          <div class="card-header">
            <span class="card-title">今日饮食</span>
            <span style="font-size: 0.85rem; color: var(--text-muted);">{{ todayDate }}</span>
          </div>

          <div v-for="(meal, key) in todayMeals" :key="key" style="padding: 12px 0; border-bottom: 1px solid var(--gray-100);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-weight: 600;">{{ mealLabels[key] }}</span>
              <div style="display: flex; gap: 8px; align-items: center;">
                <span style="font-size: 0.8rem; color: var(--text-muted);">{{ meal.totalCal }}千卡</span>
                <button class="btn btn-sm btn-secondary" @click="editMeal(key)">编辑</button>
              </div>
            </div>
            <div v-for="(food, idx) in meal.items" :key="idx" style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; padding: 4px 0;">
              <span>{{ food.name }} x{{ food.amount }}g</span>
              <div style="display: flex; gap: 6px; align-items: center;"><span style="color: var(--text-secondary);">{{ food.cal }}千卡</span><button class="btn btn-sm btn-secondary" style="padding: 2px 6px; font-size: 0.7rem;" @click="deleteFood(key, idx)">x</button></div>
            </div>
            <div v-if="meal.items.length === 0" style="font-size: 0.85rem; color: var(--text-muted); padding: 4px 0;">暂无记录</div>
        </div>
        <!-- AI Diet Evaluation -->
        <div v-if="hasDinnerRecord" style="margin-top: 16px; padding: 16px; background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: var(--radius-sm);">
          <div style="font-weight: 600; margin-bottom: 6px;">AI 今日饮食评价</div>
          <p style="font-size: 0.85rem; line-height: 1.6;">{{ dietEvaluation }}</p>
        </div>

          <!-- 日营养汇总 -->
          <div style="margin-top: 16px; padding: 16px; background: linear-gradient(135deg, var(--primary-50), var(--primary-100)); border-radius: var(--radius-sm);">
            <div style="font-weight: 600; margin-bottom: 8px;">今日营养汇总</div>
            <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 8px; font-size: 0.85rem;">
              <span>总热量</span><span style="font-weight: 600;">{{ dailyTotal.cal }}千卡</span>
              <span>蛋白质</span><span style="font-weight: 600;">{{ dailyTotal.protein }}g</span>
              <span>碳水</span><span style="font-weight: 600;">{{ dailyTotal.carbs }}g</span>
              <span>脂肪</span><span style="font-weight: 600;">{{ dailyTotal.fat }}g</span>
              <span>膳食纤维</span><span style="font-weight: 600;">{{ dailyTotal.fiber }}g</span>
              <span>糖分</span><span style="font-weight: 600;">{{ dailyTotal.sugar }}g</span>
            </div>
          </div>
        </div>

        <!-- 营养摄入达成 -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">营养摄入达成</span>
          </div>
          <div v-for="n in nutritionTargets" :key="n.key" style="padding: 10px 0; border-bottom: 1px solid var(--gray-100);">
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 4px;">
              <span>{{ n.label }}</span>
              <span>{{ n.current }} / {{ n.target }} {{ n.unit }}</span>
            </div>
            <div class="metric-progress">
              <div class="metric-progress-bar" :style="{ width: Math.min((n.current / n.target) * 100, 100) + '%', background: n.color }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：食物数据库 -->
      <div>
        <div class="card" style="margin-bottom: 20px;">
          <div class="card-header">
            <span class="card-title">食物数据库</span>
          </div>
          <div class="form-group">
            <input v-model="foodSearch" class="form-input" placeholder="搜索食物名称..." @input="handleSearch" />
          </div>
          <div v-if="foodResults.length > 0" style="max-height: 300px; overflow-y: auto;">
            <div v-for="item in foodResults" :key="item.name" class="food-item" @click="addFoodToMeal(item)">
              <div>
                <div style="font-weight: 500;">{{ item.name }}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">{{ item.category }}</div>
              </div>
              <div style="text-align: right;">
                <div style="font-weight: 600; color: var(--primary-600);">{{ item.cal }}千卡</div>
                <div style="font-size: 0.7rem; color: var(--text-muted);">/100g</div>
              </div>
            </div>
          </div>
          <div v-else style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 0.85rem;">
            {{ foodSearch ? "未找到匹配食物" : "输入关键词搜索食物" }}
          </div>
          <button class="btn btn-outline btn-sm" style="width: 100%; margin-top: 8px;" @click="showAddCustomFood = !showAddCustomFood">
            {{ showAddCustomFood ? "取消" : "+ 添加自定义食物" }}
          </button>
          <div v-if="showAddCustomFood" style="margin-top: 12px; padding: 16px; background: var(--gray-50); border-radius: var(--radius-sm);">
            <div class="form-group"><label class="form-label">食物名称</label><input v-model="customFood.name" class="form-input" placeholder="输入食物名称" /></div>
            <div class="form-group"><label class="form-label">分类</label><select v-model="customFood.category" class="form-select"><option v-for="c in foodCategories" :key="c.name" :value="c.name">{{ c.name }}</option></select></div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
              <div class="form-group"><label class="form-label">热量(/100g)</label><input v-model.number="customFood.cal" type="number" class="form-input" /></div>
              <div class="form-group"><label class="form-label">蛋白(g)</label><input v-model.number="customFood.protein" type="number" class="form-input" step="0.1" /></div>
              <div class="form-group"><label class="form-label">碳水(g)</label><input v-model.number="customFood.carbs" type="number" class="form-input" step="0.1" /></div>
              <div class="form-group"><label class="form-label">脂肪(g)</label><input v-model.number="customFood.fat" type="number" class="form-input" step="0.1" /></div>
              <div class="form-group"><label class="form-label">纤维(g)</label><input v-model.number="customFood.fiber" type="number" class="form-input" step="0.1" /></div>
              <div class="form-group"><label class="form-label">糖(g)</label><input v-model.number="customFood.sugar" type="number" class="form-input" step="0.1" /></div>
            </div>
            <button class="btn btn-primary btn-sm" style="width: 100%;" @click="addCustomFood">保存自定义食物</button>
          </div>
        </div>

        <!-- 食物分类浏览 -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">食物分类</span>
          </div>
          <div class="tabs" style="flex-wrap: wrap;">
            <button v-for="cat in foodCategories" :key="cat.name" class="tab" :class="{ active: selectedCategory === cat.name }" @click="selectedCategory = cat.name">
              {{ cat.name }}
            </button>
          </div>
          <div v-if="selectedCategory" style="max-height: 400px; overflow-y: auto;">
            <div v-for="item in categoryFoods" :key="item.name" class="food-item" @click="addFoodToMeal(item)">
              <div>
                <div style="font-weight: 500;">{{ item.name }}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">蛋白{{ item.protein }}g 碳水{{ item.carbs }}g 脂肪{{ item.fat }}g</div>
              </div>
              <div style="text-align: right;">
                <div style="font-weight: 600; color: var(--primary-600);">{{ item.cal }}千卡</div>
              </div>
            </div>
          </div>
          <div v-else style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 0.85rem;">
            点击上方分类浏览食物
          </div>
        </div>
      </div>
    </div>

    <!-- 添加食物弹窗 -->
    <div v-if="showAddFood" class="modal-overlay" @click.self="showAddFood = false">
      <div class="modal-content" style="max-width: 400px;">
        <div class="modal-header">
          <span class="modal-title">添加到{{ mealLabels[editingMeal] }}</span>
          <button class="modal-close" @click="showAddFood = false">x</button>
        </div>
        <div style="text-align: center; padding: 16px;">
          <div style="font-size: 1.1rem; font-weight: 600;">{{ selectedFood?.name }}</div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin: 4px 0 16px;">{{ selectedFood?.cal }}千卡/100g</div>
          <div class="form-group">
            <label class="form-label">份量 (克)</label>
            <input v-model.number="foodAmount" type="number" class="form-input" min="10" max="1000" />
          </div>
          <button class="btn btn-primary" style="width: 100%;" @click="confirmAdd">添加</button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, inject, onMounted } from "vue";
import AppLayout from "../components/AppLayout.vue";
import { foodDatabase, getAllFoods, searchFoods } from "../data/foods.js";
import { recipes, searchRecipes } from "../data/recipes.js";
import { useDietStore } from "../store/diet.js";

const showToast = inject("showToast");
const showPlan = ref(true);
const currentPlanDay = ref(1);
const foodSearch = ref("");
const showAddCustomFood = ref(false);
const customFood = ref({ name: "", category: "谷类及薯类", cal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 });
const foodResults = ref([]);
const selectedCategory = ref("谷类及薯类");
const showAddFood = ref(false);
const editingMeal = ref("breakfast");
const selectedFood = ref(null);
const foodAmount = ref(100);

const mealLabels = { breakfast: "早餐", lunch: "午餐", dinner: "晚餐", snack: "加餐" };

const todayDate = new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });

// Today meals from store (persistent across pages)
const dietStore = useDietStore();
const todayMeals = dietStore.meals;

const dailyTotal = computed(() => dietStore.dailyTotal);

const nutritionTargets = computed(() => [
  { key: "cal", label: "热量", current: dailyTotal.value.cal, target: 2000, unit: "千卡", color: "var(--primary-500)" },
  { key: "protein", label: "蛋白质", current: dailyTotal.value.protein, target: 70, unit: "g", color: "#3b82f6" },
  { key: "carbs", label: "碳水", current: dailyTotal.value.carbs, target: 250, unit: "g", color: "#10b981" },
  { key: "fat", label: "脂肪", current: dailyTotal.value.fat, target: 60, unit: "g", color: "#f59e0b" },
  { key: "fiber", label: "膳食纤维", current: dailyTotal.value.fiber, target: 25, unit: "g", color: "#8b5cf6" },
]);

// 饮食计划模拟数据
const dietPlanData = ref(null);
for (let d = 1; d <= 30; d++) {
  if (!dietPlanData.value) dietPlanData.value = {};
  const week = Math.ceil(d / 7);
  const plans = ["高蛋白低碳日", "均衡营养日", "低脂高纤日", "碳水补充日"];
  const plan = plans[week % 4];
  dietPlanData.value[d] = {
    plan: plan + "\n早餐: " + ["全麦面包2片+鸡蛋+牛奶", "燕麦粥+蓝莓+杏仁", "蔬菜蛋饼+豆浆", "全麦馒头+豆浆+鸡蛋"][d % 4] + "\n午餐: " + ["杂粮饭+鸡胸肉+西兰花", "糙米饭+三文鱼+菠菜", "藜麦+牛肉+芦笋", "红薯+豆腐+时蔬"][d % 4] + "\n晚餐: " + ["蔬菜沙拉+烤鸡腿", "番茄汤+鱼肉+青菜", "菌菇汤+虾仁+西兰花", "豆腐蔬菜锅"][d % 4],
    cal: [1800, 2000, 1600, 2200][week % 4],
    protein: [80, 65, 70, 90][week % 4],
    carbs: [180, 250, 150, 280][week % 4],
    fat: [45, 50, 35, 55][week % 4],
  };
}

const currentDayPlan = computed(() => dietPlanData.value?.[currentPlanDay.value]?.plan || "");
const currentDayCal = computed(() => dietPlanData.value?.[currentPlanDay.value]?.cal || 0);
const currentDayProtein = computed(() => dietPlanData.value?.[currentPlanDay.value]?.protein || 0);
const currentDayCarbs = computed(() => dietPlanData.value?.[currentPlanDay.value]?.carbs || 0);
const currentDayFat = computed(() => dietPlanData.value?.[currentPlanDay.value]?.fat || 0);

function scrollPlan(dir) {
  const next = currentPlanDay.value + dir;
  if (next >= 1 && next <= 30) currentPlanDay.value = next;
}

// 全面食物数据库
// Foods from foodDatabase
const allFoods = getAllFoods();
const foodCategories = Object.keys(foodDatabase).map(k => ({ name: k }));

const categoryFoods = computed(() => foodDatabase[selectedCategory.value] || []);

function handleSearch() {
  if (!foodSearch.value.trim()) {
    foodResults.value = [];
    return;
  }
  foodResults.value = searchFoods(foodSearch.value);
  if (foodResults.value.length < 5) {
    const recipeResults = recipes.filter(r => r.name.includes(foodSearch.value.trim()));
    recipeResults.forEach(r => foodResults.value.push({ name: r.name + "(食谱)", cal: parseInt(r.calories), category: "食谱", unit: "份" }));
  }
}

function editMeal(key) {
  editingMeal.value = key;
}

function addFoodToMeal(food) {
  selectedFood.value = food;
  foodAmount.value = 100;
  showAddFood.value = true;
}


function deleteFood(mealKey, idx) {
  dietStore.deleteFood(mealKey, idx);
}

const hasDinnerRecord = computed(() => todayMeals.dinner.items.length > 0);

const dietEvaluation = computed(() => {
  const total = dailyTotal.value;
  if (total.cal === 0) return "今天还没有记录饮食，记得按时吃饭哦！";
  let text = "";
  if (total.cal < 1200) text += "热量摄入偏低，建议适当增加优质碳水和蛋白质。";
  else if (total.cal > 2500) text += "热量摄入偏高，注意控制份量和烹饪油量。";
  else text += "总热量摄入适中，营养搭配合理。";
  if (total.protein < 50) text += "蛋白质摄入不足，建议每餐搭配优质蛋白。";
  else if (total.protein > 120) text += "蛋白质充足，注意搭配蔬菜。";
  else text += "蛋白质摄入达标。";
  if (total.fiber < 15) text += "膳食纤维偏少，多摄入全谷物和深色蔬菜。";
  else text += "膳食纤维良好。";
  if (total.sugar > 50) text += "糖分偏高，减少含糖饮料。";
  else text += "糖分控制良好。";
  return text;
});
function confirmAdd() {
  if (!selectedFood.value) return;
  const ratio = foodAmount.value / 100;
  const food = {
    name: selectedFood.value.name,
    amount: foodAmount.value,
    cal: Math.round(selectedFood.value.cal * ratio),
    protein: Math.round((selectedFood.value.protein || 0) * ratio),
    carbs: Math.round((selectedFood.value.carbs || 0) * ratio),
    fat: Math.round((selectedFood.value.fat || 0) * ratio),
    fiber: Math.round((selectedFood.value.fiber || 0) * ratio),
    sugar: Math.round((selectedFood.value.sugar || 0) * ratio),
  };
  dietStore.addFood(editingMeal.value, food);
  showAddFood.value = false;
  showToast("已添加到" + mealLabels[editingMeal.value], "success");
}

onMounted(() => { dietStore.checkDate(); });

function addCustomFood() {
  if (!customFood.value.name) { showToast("请输入食物名称", "error"); return; }
  const cat = customFood.value.category;
  if (!foodDatabase[cat]) foodDatabase[cat] = [];
  foodDatabase[cat].push({
    name: customFood.value.name,
    cal: customFood.value.cal || 0,
    protein: customFood.value.protein || 0,
    carbs: customFood.value.carbs || 0,
    fat: customFood.value.fat || 0,
    fiber: customFood.value.fiber || 0,
    sugar: customFood.value.sugar || 0,
    unit: "100g",
  });
  customFood.value = { name: "", category: "谷类及薯类", cal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 };
  showAddCustomFood.value = false;
  showToast("自定义食物已添加", "success");
}
</script>

<style scoped>
.plan-day-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--gray-100);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s;
}
.plan-day-pill.active {
  background: var(--primary-500);
  color: white;
}
.plan-day-pill:hover:not(.active) {
  background: var(--gray-200);
}
.food-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--gray-100);
  cursor: pointer;
  transition: background 0.2s;
}
.food-item:hover {
  background: var(--primary-50);
  margin: 0 -12px;
  padding: 10px 12px;
  border-radius: 8px;
}
</style>