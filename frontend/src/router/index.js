import { createRouter, createWebHistory } from "vue-router";

const routes = [
  { path: "/login", name: "Login", component: () => import("../views/Login.vue"), meta: { requiresAuth: false } },
  { path: "/register", name: "Register", component: () => import("../views/Register.vue"), meta: { requiresAuth: false } },
  { path: "/", name: "Dashboard", component: () => import("../views/Dashboard.vue"), meta: { requiresAuth: true } },
  { path: "/activity", name: "Activity", component: () => import("../views/Activity.vue"), meta: { requiresAuth: true } },
  { path: "/diet", name: "Diet", component: () => import("../views/Diet.vue"), meta: { requiresAuth: true } },
  { path: "/report", name: "Report", component: () => import("../views/Report.vue"), meta: { requiresAuth: true } },
  { path: "/report/:month", name: "MonthReport", component: () => import("../views/Report.vue"), meta: { requiresAuth: true } },
  { path: "/history", name: "History", component: () => import("../views/History.vue"), meta: { requiresAuth: true } },
  { path: "/settings", name: "Settings", component: () => import("../views/Settings.vue"), meta: { requiresAuth: true } },
  { path: "/other", name: "OtherFeatures", component: () => import("../views/OtherFeatures.vue"), meta: { requiresAuth: true } },
  { path: "/profile", name: "Profile", component: () => import("../views/Profile.vue"), meta: { requiresAuth: true } },
];

const router = createRouter({ history: createWebHistory(), routes });

router.beforeEach((to, from, next) => {
  const isLoggedIn = !!localStorage.getItem("userId");
  if (to.meta.requiresAuth && !isLoggedIn) next("/login");
  else if (!to.meta.requiresAuth && isLoggedIn && (to.path === "/login" || to.path === "/register")) next("/");
  else next();
});

export default router;
