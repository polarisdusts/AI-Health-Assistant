// 饮食持久化存储 - 按日期保存, 北京时间0点重置
import { defineStore } from "pinia";
import { reactive } from "vue";

function getTodayKey() {
  const now = new Date();
  const offset = 8; // UTC+8 Beijing
  const local = new Date(now.getTime() + offset * 3600000);
  return local.toISOString().slice(0, 10);
}

function loadDayData(key) {
  try {
    const saved = localStorage.getItem("diet_" + key);
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
}

function saveDayData(key, data) {
  localStorage.setItem("diet_" + key, JSON.stringify(data));
}

const emptyMeal = () => ({ items: [], totalCal: 0 });

export const useDietStore = defineStore("diet", {
  state: () => {
    const today = getTodayKey();
    const saved = loadDayData(today);
    return {
      todayKey: today,
      meals: saved ? saved : {
        breakfast: emptyMeal(),
        lunch: emptyMeal(),
        dinner: emptyMeal(),
        snack: emptyMeal(),
      },
    };
  },
  getters: {
    dailyTotal(state) {
      let cal = 0, protein = 0, carbs = 0, fat = 0, fiber = 0, sugar = 0;
      Object.values(state.meals).forEach((meal) => {
        meal.items.forEach((food) => {
          cal += food.cal || 0;
          protein += food.protein || 0;
          carbs += food.carbs || 0;
          fat += food.fat || 0;
          fiber += food.fiber || 0;
          sugar += food.sugar || 0;
        });
      });
      return { cal: Math.round(cal), protein: Math.round(protein), carbs: Math.round(carbs), fat: Math.round(fat), fiber: Math.round(fiber), sugar: Math.round(sugar) };
    },
  },
  actions: {
    checkDate() {
      const today = getTodayKey();
      if (today !== this.todayKey) {
        this.todayKey = today;
        this.meals = { breakfast: emptyMeal(), lunch: emptyMeal(), dinner: emptyMeal(), snack: emptyMeal() };
      }
    },
    addFood(mealKey, food) {
      this.checkDate();
      this.meals[mealKey].items.push({ ...food });
      saveDayData(this.todayKey, this.meals);
    },
    deleteFood(mealKey, idx) {
      this.checkDate();
      this.meals[mealKey].items.splice(idx, 1);
      saveDayData(this.todayKey, this.meals);
    },
    saveToStorage() {
      saveDayData(this.todayKey, this.meals);
    },
  },
});
