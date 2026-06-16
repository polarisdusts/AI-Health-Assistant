import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Auth
export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  register: (data) => api.post("/auth/register", data),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
};

// Profile
export const profileAPI = {
  get: () => api.get("/profile"),
  update: (data) => api.put("/profile", data),
};

// Weight
export const weightAPI = {
  record: (data) => api.post("/weight", data),
  get: (params) => api.get("/weight", { params }),
  delete: (id) => api.delete(`/weight/${id}`),
};

// Activity
export const activityAPI = {
  create: (data) => api.post("/activity", data),
  get: (params) => api.get("/activity", { params }),
  getTypes: () => api.get("/activity/types"),
  delete: (id) => api.delete(`/activity/${id}`),
};

// Plan
export const planAPI = {
  generateMonthly: () => api.post("/plan/generate-monthly"),
  generateDetailedExercise: (data) => api.post("/plan/generate-detailed-exercise", data),
  getActive: () => api.get("/plan/active"),
  getHistory: () => api.get('/plan/history'),
  saveDetailedPlans: (data) => api.post("/plan/save-detailed-plans", data),
  getDetailedPlans: () => api.get("/plan/detailed-plans"),
};

// Report
export const reportAPI = {
  getMonthly: (month) => api.get(`/report/monthly/${month}`),
  getCurrentSummary: () => api.get("/report/current-summary"),
};

// Device (smart bracelet)
export const deviceAPI = {
  bind: (data) => api.post("/device/bind", data),
  unbind: (id) => api.post("/device/unbind/" + id),
  list: () => api.get("/device/list"),
  summary: () => api.get("/device/summary"),
  heartRate: () => api.get("/device/heart-rate"),
  bloodOxygen: () => api.get("/device/blood-oxygen"),
  sleepHistory: (params) => api.get("/device/sleep-history", { params }),
};

export default api;
