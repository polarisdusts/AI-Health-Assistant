<template>
  <AppLayout>
    <div class="page-header">
      <div>
        <h1 class="page-title">其他功能</h1>
        <p class="page-subtitle">食物营养查询与食谱推荐</p>
      </div>
    </div>

    <div class="tabs">
      <button v-for="tab in tabs" :key="tab.key" class="tab" :class="{ active: activeTab === tab.key }" @click="activeTab = tab.key">{{ tab.label }}</button>
    </div>

    <!-- 食物卡路里 -->
    <div v-if="activeTab === 'calories'" class="report-grid">
      <div class="report-card full-width">
        <div class="card-header"><span class="card-title">食物卡路里查询</span></div>
        <div class="form-group">
          <input v-model="foodQuery" class="form-input" placeholder="输入食物名称查询，例如：米饭、鸡胸肉、苹果" @keyup.enter="searchFood" />
          <button class="btn btn-primary btn-sm" style="margin-top: 8px;" @click="searchFood">查询</button>
        </div>
        <div v-if="foodResults.length > 0" style="margin-top: 16px;">
          <div v-for="item in foodResults" :key="item.name" style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--gray-100);">
            <span style="font-weight: 500;">{{ item.name }}</span>
            <span style="color: var(--primary-600); font-weight: 600;">{{ item.calories }} 千卡/100g</span>
          </div>
        </div>
        <div v-else-if="searched" style="text-align: center; padding: 24px; color: var(--text-muted);">未找到相关食物数据</div>
      </div>
      <div v-for="cat in foodCategories" :key="cat.name" class="report-card">
        <div class="card-header"><span class="card-title">{{ cat.name }}</span></div>
        <div v-for="item in cat.items" :key="item.name" style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 0.85rem;">
          <span>{{ item.name }}</span>
          <span style="font-weight: 500;">{{ item.cal }} 千卡</span>
        </div>
      </div>
    </div>

    <!-- 食物嘌呤 -->
    <div v-if="activeTab === 'purine'" class="report-grid">
      <div class="report-card full-width">
        <div class="card-header"><span class="card-title">食物嘌呤含量查询</span></div>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 16px;">嘌呤含量分类：低嘌呤（<50mg/100g）、中嘌呤（50-150mg）、高嘌呤（>150mg）</p>
        <div v-for="cat in purineData" :key="cat.level" class="report-stat">
          <span class="report-stat-label">{{ cat.level }}</span>
          <span class="report-stat-value" :style="{ color: cat.color }">{{ cat.range }}</span>
        </div>
      </div>
      <div v-for="cat in purineCategories" :key="cat.name" class="report-card">
        <div class="card-header"><span class="card-title">{{ cat.name }}</span></div>
        <div v-for="item in cat.items" :key="item.name" style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 0.85rem;">
          <span>{{ item.name }}</span>
          <span style="font-weight: 500;">{{ item.purine }}</span>
        </div>
      </div>
    </div>

    <!-- 食谱 -->
    <div v-if="activeTab === 'recipe'" class="report-grid">
      <div class="report-card full-width">
        <div class="card-header">
          <span class="card-title">推荐食谱（点击+添加到餐）</span>
          <div style="display: flex; gap: 8px;">
            <input v-model="recipeSearch" class="form-input" style="width: 180px;" placeholder="搜索食谱..." @input="filterRecipes" />
            <span style="font-size: 0.85rem; color: var(--text-muted); align-self: center;">共{{ filteredRecipes.length }}道</span>
          </div>
        </div>
        <div v-for="recipe in filteredRecipes" :key="recipe.name" style="padding: 12px 0; border-bottom: 1px solid var(--gray-100); display: flex; align-items: center;">
          <div style="flex: 1;">
            <div style="font-weight: 600; margin-bottom: 2px;">{{ recipe.name }}</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">{{ recipe.desc }}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">热量: {{ recipe.calories }}千卡 | 蛋白: {{ recipe.protein }} | 碳水: {{ recipe.carbs }}</div>
          </div>
          <div class="dropdown" style="position: relative;">
            <button class="btn btn-sm btn-primary" style="border-radius: 50%; width: 32px; height: 32px; padding: 0; font-size: 1.1rem;" @click="toggleDropdown(recipe.name)">+</button>
            <div v-if="activeDropdown === recipe.name" class="dropdown-menu" style="position: absolute; right: 0; top: 100%; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10; min-width: 140px;">
              <div style="padding: 4px 0;">
                <div style="padding: 8px 16px; font-size: 0.8rem; color: var(--text-secondary); border-bottom: 1px solid var(--gray-100);">添加到：</div>
                <button style="display: block; width: 100%; padding: 8px 16px; text-align: left; background: none; border: none; font-size: 0.85rem; cursor: pointer;" @click="addToMeal(recipe, 'breakfast')">早餐</button>
                <button style="display: block; width: 100%; padding: 8px 16px; text-align: left; background: none; border: none; font-size: 0.85rem; cursor: pointer;" @click="addToMeal(recipe, 'lunch')">午餐</button>
                <button style="display: block; width: 100%; padding: 8px 16px; text-align: left; background: none; border: none; font-size: 0.85rem; cursor: pointer;" @click="addToMeal(recipe, 'dinner')">晚餐</button>
                <button style="display: block; width: 100%; padding: 8px 16px; text-align: left; background: none; border: none; font-size: 0.85rem; cursor: pointer;" @click="addToMeal(recipe, 'snack')">加餐</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 食物碳水 -->
    <div v-if="activeTab === 'carbs'" class="report-grid">
      <div class="report-card full-width">
        <div class="card-header"><span class="card-title">食物碳水含量查询</span></div>
        <div v-for="cat in carbsCategories" :key="cat.name" class="report-stat">
          <span class="report-stat-label">{{ cat.name }}</span>
          <span class="report-stat-value">{{ cat.items.map(i => i.name + "(" + i.carbs + "g)").join("、") }}</span>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, inject } from "vue";
import AppLayout from "../components/AppLayout.vue";

const showToast = inject("showToast");
const activeTab = ref("calories");
const foodQuery = ref("");
const foodResults = ref([]);
const searched = ref(false);

const tabs = [
  { key: "calories", label: "食物卡路里" },
  { key: "purine", label: "食物嘌呤" },
  { key: "recipe", label: "食谱" },
  { key: "carbs", label: "食物碳水" },
];

const foodCategories = [
  { name: "主食类", items: [{ name: "白米饭", cal: 116 }, { name: "糙米饭", cal: 111 }, { name: "全麦面包(片)", cal: 78 }, { name: "红薯", cal: 86 }, { name: "燕麦(100g)", cal: 367 }, { name: "荞麦面", cal: 340 }, { name: "玉米", cal: 96 }, { name: "藜麦", cal: 368 }, { name: "意大利面", cal: 350 }, { name: "小米粥", cal: 46 }] },
  { name: "蛋白质", items: [{ name: "鸡胸肉", cal: 165 }, { name: "三文鱼", cal: 208 }, { name: "鸡蛋(个)", cal: 72 }, { name: "豆腐", cal: 76 }, { name: "瘦牛肉", cal: 250 }, { name: "虾仁", cal: 93 }, { name: "金枪鱼", cal: 184 }, { name: "牛奶(250ml)", cal: 135 }, { name: "酸奶", cal: 72 }, { name: "豆腐干", cal: 140 }] },
  { name: "蔬菜类", items: [{ name: "西兰花", cal: 34 }, { name: "菠菜", cal: 23 }, { name: "番茄", cal: 18 }, { name: "黄瓜", cal: 15 }, { name: "胡萝卜", cal: 41 }, { name: "芦笋", cal: 20 }, { name: "蘑菇", cal: 22 }, { name: "青椒", cal: 20 }, { name: "茄子", cal: 25 }, { name: "白菜", cal: 13 }] },
  { name: "水果类", items: [{ name: "苹果", cal: 52 }, { name: "香蕉", cal: 89 }, { name: "蓝莓", cal: 57 }, { name: "橙子", cal: 47 }, { name: "葡萄", cal: 69 }, { name: "草莓", cal: 32 }, { name: "牛油果", cal: 160 }, { name: "猕猴桃", cal: 61 }, { name: "火龙果", cal: 55 }, { name: "柠檬", cal: 29 }] },
  { name: "坚果类", items: [{ name: "杏仁", cal: 579 }, { name: "核桃", cal: 654 }, { name: "腰果", cal: 553 }, { name: "花生", cal: 567 }, { name: "开心果", cal: 560 }] },
  { name: "饮品类", items: [{ name: "美式咖啡", cal: 2 }, { name: "拿铁", cal: 150 }, { name: "绿茶", cal: 1 }, { name: "橙汁", cal: 45 }, { name: "豆浆", cal: 31 }] },
];

const purineData = [
  { level: "低嘌呤食物（鼓励食用）", range: "< 50mg/100g", color: "#10b981" },
  { level: "中嘌呤食物（适量食用）", range: "50-150mg/100g", color: "#f59e0b" },
  { level: "高嘌呤食物（避免食用）", range: "> 150mg/100g", color: "#ef4444" },
];

const purineCategories = [
  { name: "低嘌呤", items: [{ name: "大米", purine: "18mg" }, { name: "牛奶", purine: "1.4mg" }, { name: "鸡蛋", purine: "2mg" }, { name: "番茄", purine: "4mg" }, { name: "黄瓜", purine: "3mg" }, { name: "白菜", purine: "5mg" }, { name: "胡萝卜", purine: "8mg" }, { name: "苹果", purine: "3mg" }, { name: "蜂蜜", purine: "1mg" }] },
  { name: "中嘌呤", items: [{ name: "猪肉", purine: "80mg" }, { name: "牛肉", purine: "83mg" }, { name: "鸡肉", purine: "140mg" }, { name: "豆类", purine: "75mg" }, { name: "虾", purine: "130mg" }, { name: "三文鱼", purine: "70mg" }, { name: "豆腐", purine: "55mg" }, { name: "香菇", purine: "90mg" }] },
  { name: "高嘌呤", items: [{ name: "动物肝脏", purine: "300mg" }, { name: "沙丁鱼", purine: "295mg" }, { name: "贝类", purine: "200mg" }, { name: "浓汤", purine: "160mg" }, { name: "酵母", purine: "589mg" }, { name: "带鱼", purine: "290mg" }, { name: "紫菜", purine: "274mg" }, { name: "啤酒", purine: "80mg" }] },
];

import { recipes } from "../data/recipes.js";

const carbsCategories = [
  { name: "高碳水(>50g/100g)", items: [{ name: "大米", carbs: "77" }, { name: "面条", carbs: "65" }, { name: "面包", carbs: "58" }, { name: "燕麦", carbs: "66" }] },
  { name: "中碳水(20-50g)", items: [{ name: "红薯", carbs: "20" }, { name: "香蕉", carbs: "23" }, { name: "玉米", carbs: "19" }, { name: "土豆", carbs: "17" }] },
  { name: "低碳水(<10g)", items: [{ name: "鸡胸肉", carbs: "0" }, { name: "鸡蛋", carbs: "1.1" }, { name: "菠菜", carbs: "3.6" }, { name: "西兰花", carbs: "7" }] },
];

const recipeSearch = ref("");
const activeDropdown = ref(null);
const filteredRecipes = computed(() => {
  if (!recipeSearch.value.trim()) return recipes;
  const q = recipeSearch.value.trim().toLowerCase();
  return recipes.filter(r => r.name.toLowerCase().includes(q));
});

const toggleDropdown = (name) => {
  activeDropdown.value = activeDropdown.value === name ? null : name;
};

const addToMeal = (recipe, mealKey) => {
  activeDropdown.value = null;
  // Save to localStorage for Diet page
  const today = new Date();
  const offset = 8;
  const localDate = new Date(today.getTime() + offset * 3600000);
  const todayKey = localDate.toISOString().slice(0, 10);
  
  let dayData;
  try {
    dayData = JSON.parse(localStorage.getItem("diet_" + todayKey));
  } catch { dayData = null; }
  if (!dayData) {
    dayData = { breakfast: { items: [], totalCal: 0 }, lunch: { items: [], totalCal: 0 }, dinner: { items: [], totalCal: 0 }, snack: { items: [], totalCal: 0 } };
  }
  
  const cal = typeof recipe.calories === "string" ? parseInt(recipe.calories) : (recipe.calories || 0);
  const protein = typeof recipe.protein === "string" ? parseInt(recipe.protein) : (recipe.protein || 0);
  const carbs = typeof recipe.carbs === "string" ? parseInt(recipe.carbs) : (recipe.carbs || 0);
  const fat = typeof recipe.fat === "string" ? parseInt(recipe.fat) : (recipe.fat || 0);
  
  dayData[mealKey].items.push({
    name: recipe.name + "（食谱）",
    amount: 1,
    cal: cal,
    protein: protein,
    carbs: carbs,
    fat: fat,
    fiber: 0,
    sugar: 0,
  });
  
  localStorage.setItem("diet_" + todayKey, JSON.stringify(dayData));
  showToast("已添加到" + { breakfast: "早餐", lunch: "午餐", dinner: "晚餐", snack: "加餐" }[mealKey], "success");
};

const searchFood = () => {
  if (!foodQuery.value.trim()) return;
  searched.value = true;
  foodResults.value = [];
  const q = foodQuery.value.trim().toLowerCase();
  const allFoods = [];
  foodCategories.forEach((cat) => cat.items.forEach((item) => allFoods.push({ ...item, category: cat.name })));
  foodResults.value = allFoods.filter((f) => f.name.includes(q));
};
</script>