// 全局计时器状态 - 跨页面不中断
import { defineStore } from "pinia";

export const useTimerStore = defineStore("timer", {
  state: () => ({
    seconds: 0,
    isRunning: false,
    isPaused: false,
    mode: "timing", // timing or countdown
    targetMinutes: 0,
    timerType: "",
    startTime: null,
    intervalId: null,
  }),
  actions: {
    startTimer(type, targetMinutes) {
      if (this.isRunning) return;
      this.timerType = type;
      this.targetMinutes = targetMinutes || 0;
      this.startTime = Date.now();
      
      if (targetMinutes > 0) {
        this.mode = "countdown";
        this.seconds = targetMinutes * 60;
      } else {
        this.mode = "timing";
        this.seconds = 0;
      }
      
      this.isRunning = true;
      this.isPaused = false;
      
      if (this.intervalId) clearInterval(this.intervalId);
      this.intervalId = setInterval(() => {
        if (this.mode === "countdown") {
          this.seconds--;
          if (this.seconds <= 0) {
            this.seconds = 0;
            this.stopTimer();
          }
        } else {
          this.seconds++;
        }
      }, 1000);
    },
    pauseTimer() {
      if (!this.isRunning) return;
      this.isPaused = !this.isPaused;
      if (this.isPaused && this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      } else if (!this.isPaused && !this.intervalId) {
        this.intervalId = setInterval(() => {
          if (this.mode === "countdown") {
            this.seconds--;
            if (this.seconds <= 0) {
              this.seconds = 0;
              this.stopTimer();
            }
          } else {
            this.seconds++;
          }
        }, 1000);
      }
    },
    stopTimer() {
      this.isRunning = false;
      this.isPaused = false;
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    },
    formatTime() {
      const s = Math.max(0, this.seconds);
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return String(m).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
    },
    getDurationMinutes() {
      if (this.mode === "countdown") {
        return Math.round((this.targetMinutes * 60 - this.seconds) / 60);
      }
      return Math.round(this.seconds / 60);
    },
  },
});
