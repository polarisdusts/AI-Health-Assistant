import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router/index.js";
import "./assets/styles/main.css";

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount("#app");

// Global theme initialization
(function initTheme() {
  const savedTheme = localStorage.getItem("themeColor") || "default";
  const themeColorMap = {
    default: { primary: "#f97316", primary600: "#ea580c", primary700: "#c2410c", primary800: "#9a3412" },
    rose: { primary: "#efafad", primary600: "#e89895", primary700: "#e0817d", primary800: "#d86a65" },
    peach: { primary: "#f0945d", primary600: "#ed7d3b", primary700: "#ea6619", primary800: "#cc5610" },
    warmgray: { primary: "#c1b2a3", primary600: "#b19f8d", primary700: "#a18c77", primary800: "#917961" },
    sage: { primary: "#b7d07a", primary600: "#a8c660", primary700: "#99bc46", primary800: "#8aaf3a" },
    sky: { primary: "#8abcd1", primary600: "#70aec8", primary700: "#56a0bf", primary800: "#4190b0" },
  };
  const colors = themeColorMap[savedTheme] || themeColorMap.default;
  const root = document.documentElement;
  root.style.setProperty("--primary-500", colors.primary);
  root.style.setProperty("--primary-600", colors.primary600);
  root.style.setProperty("--primary-700", colors.primary700);
  root.style.setProperty("--primary-800", colors.primary800);
})();
