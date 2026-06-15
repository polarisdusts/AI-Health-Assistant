import { defineStore } from "pinia";
import { activityAPI, weightAPI, planAPI, reportAPI } from "../api/index.js";

export const useHealthStore = defineStore("health", {
  state: () => ({
    // Activity data
    activities: [],
    activitySummary: { totalCalories: 0, totalSteps: 0, totalActivities: 0, mvCount: 0 },
    todaySummary: { calories: 0, steps: 0, activities: 0, mvCount: 0 },
    monthlySummary: { calories: 0, steps: 0, activities: 0, mvCount: 0 },
    activityTypes: [],

    // Weight data
    weightRecords: [],

    // Plans
    activePlan: null,
    planHistory: [],

    // Loading states
    loading: false,
  }),
  actions: {
    async loadCurrentSummary() {
      try {
        const { data } = await reportAPI.getCurrentSummary();
        this.todaySummary = data.today;
        this.monthlySummary = data.monthly;
        this.activities = data.recentActivities;
        this.activitySummary = {
          totalCalories: data.monthly.calories,
          totalSteps: data.monthly.steps,
          totalActivities: data.monthly.activities,
          mvCount: data.monthly.mvCount,
        };
      } catch (err) {
        console.error("鍔犺浇姹囨€绘暟鎹け璐?", err);
      }
    },
    async loadActivities(params) {
      try {
        const { data } = await activityAPI.get(params);
        this.activities = data.records;
        this.activitySummary = data.summary;
      } catch (err) {
        console.error("鍔犺浇娲诲姩璁板綍澶辫触:", err);
      }
    },
    async loadActivityTypes() {
      try {
        const { data } = await activityAPI.getTypes();
        this.activityTypes = data.types;
      } catch (err) {
        console.error("鍔犺浇杩愬姩绫诲瀷澶辫触:", err);
      }
    },
    async recordActivity(activityData) {
      try {
        const { data } = await activityAPI.create(activityData);
        // Refresh summary
        await this.loadCurrentSummary();
        return { success: true, record: data.record };
      } catch (err) {
        return {
          success: false,
          error: err.response?.data?.error || "璁板綍澶辫触",
        };
      }
    },
    async deleteActivity(id) {
      try {
        await activityAPI.delete(id);
        await this.loadCurrentSummary();
        return { success: true };
      } catch (err) {
        return { success: false, error: "鍒犻櫎澶辫触" };
      }
    },
    async loadWeightRecords() {
      try {
        const { data } = await weightAPI.get();
        this.weightRecords = data.records;
      } catch (err) {
        console.error("鍔犺浇浣撻噸璁板綍澶辫触:", err);
      }
    },
    async recordWeight(weightData) {
      try {
        const { data } = await weightAPI.record(weightData);
        await this.loadWeightRecords();
        return { success: true, record: data.record };
      } catch (err) {
        return {
          success: false,
          error: err.response?.data?.error || "璁板綍澶辫触",
        };
      }
    },
    async generateMonthlyPlan() {
      this.loading = true;
      try {
        const { data } = await planAPI.generateMonthly();
        this.activePlan = data.plan;
        return { success: true, plan: data.plan };
      } catch (err) {
        return {
          success: false,
          error: err.response?.data?.error || "鐢熸垚璁″垝澶辫触",
          needProfile: err.response?.data?.needProfile,
        };
      } finally {
        this.loading = false;
      }
    },
    async loadActivePlan() {
      try {
        const { data } = await planAPI.getActive();
        this.activePlan = data.plan;
      } catch (err) {
        console.error("鍔犺浇娲昏穬璁″垝澶辫触:", err);
      }
    },
    async loadPlanHistory() {
      try {
        const { data } = await planAPI.getHistory();
        this.planHistory = data.plans;
      } catch (err) {
        console.error("鍔犺浇鍘嗗彶璁″垝澶辫触:", err);
      }
    },
  },
});
