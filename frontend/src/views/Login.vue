<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo">H+</div>
      <h1 class="auth-title">智康AI</h1>
      <p class="auth-subtitle">智能健康管理系统 - 登录</p>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label">用户名 / 邮箱</label>
          <input v-model="form.username" class="form-input" placeholder="请输入用户名或邮箱" required />
        </div>
        <div class="form-group">
          <label class="form-label">密码</label>
          <input v-model="form.password" type="password" class="form-input" placeholder="请输入密码" required />
        </div>
        <div class="form-group" style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" v-model="form.rememberMe" id="remember" />
          <label for="remember" style="font-size: 0.9rem; color: var(--text-secondary);">记住登录状态</label>
        </div>
        <div v-if="error" style="color: var(--danger); font-size: 0.85rem; margin-bottom: 16px; text-align: center;">{{ error }}</div>
        <button type="submit" class="btn btn-primary btn-lg" style="width: 100%;" :disabled="loading">{{ loading ? "登录中..." : "登 录" }}</button>
      </form>
      <div style="text-align: center; margin-top: 24px;">
        <span style="color: var(--text-secondary); font-size: 0.9rem;">还没有账号？</span>
        <router-link to="/register" style="color: var(--primary-500); font-weight: 500;">立即注册</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../store/auth.js";

const router = useRouter();
const authStore = useAuthStore();
const showToast = inject("showToast");
const form = ref({ username: "", password: "", rememberMe: false });
const error = ref("");
const loading = ref(false);

const handleLogin = async () => {
  error.value = "";
  loading.value = true;
  const result = await authStore.login(form.value);
  loading.value = false;
  if (result.success) {
    showToast("登录成功！", "success");
    router.push("/");
  } else {
    error.value = result.error;
  }
};
</script>