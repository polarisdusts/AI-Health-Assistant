import { defineStore } from "pinia";
import { authAPI, profileAPI } from "../api/index.js";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    profile: null,
    isLoggedIn: !!localStorage.getItem("userId"),
    loading: false,
  }),
  getters: {
    username: (state) => state.user?.username || "",
    hasProfile: (state) => !!(state.profile?.age && state.profile?.height),
  },
  actions: {
    async login(credentials) {
      this.loading = true;
      try {
        const { data } = await authAPI.login(credentials);
        this.user = data.user;
        this.isLoggedIn = true;
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("username", data.user.username);
        // Try to load profile
        try {
          const profileRes = await profileAPI.get();
          this.profile = profileRes.data.profile;
        } catch (e) {
          // Profile not set yet
        }
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err.response?.data?.error || "",
        };
      } finally {
        this.loading = false;
      }
    },
    async register(credentials) {
      this.loading = true;
      try {
        const { data } = await authAPI.register(credentials);
        this.user = data.user;
        this.isLoggedIn = true;
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("username", data.user.username);
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err.response?.data?.error || "",
        };
      } finally {
        this.loading = false;
      }
    },
    async logout() {
      try {
        await authAPI.logout();
      } catch (e) {
        // Ignore
      }
      this.user = null;
      this.profile = null;
      this.isLoggedIn = false;
      localStorage.removeItem("userId");
      localStorage.removeItem("username");
    },
    async loadUser() {
      try {
        const { data } = await authAPI.me();
        this.user = data.user;
        this.isLoggedIn = true;
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("username", data.user.username);
      } catch (err) {
        this.isLoggedIn = false;
        localStorage.removeItem("userId");
        localStorage.removeItem("username");
      }
    },
    async loadProfile() {
      try {
        const { data } = await profileAPI.get();
        this.profile = data.profile;
      } catch (err) {
        // Ignore
      }
    },
    async updateProfile(profileData) {
      try {
        const { data } = await profileAPI.update(profileData);
        this.profile = data.profile;
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err.response?.data?.error || "",
        };
      }
    },
  },
});
