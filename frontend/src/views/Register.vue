<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo">H+</div>
      <h1 class="auth-title">注册账号</h1>
      <p class="auth-subtitle">加入智康AI，开启健康管理之旅</p>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label class="form-label">用户名</label>
          <input v-model="form.username" class="form-input" placeholder="请输入用户名" required />
        </div>
        <div class="form-group">
          <label class="form-label">邮箱</label>
          <input v-model="form.email" type="email" class="form-input" placeholder="请输入邮箱" required />
        </div>
        <div class="form-group">
          <label class="form-label">密码</label>
          <input v-model="form.password" type="password" class="form-input" placeholder="至少6位密码" required minlength="6" />
        </div>
        <div class="form-group">
          <label class="form-label">确认密码</label>
          <input v-model="form.confirmPassword" type="password" class="form-input" placeholder="再次输入密码" required />
        </div>
        <div v-if="error" style="color: var(--danger); font-size: 0.85rem; margin-bottom: 16px; text-align: center;">{{ error }}</div>
        <button type="submit" class="btn btn-primary btn-lg" style="width: 100%;" :disabled="loading">{{ loading ? "注册中..." : "注 册" }}</button>
      </form>
      <div style="text-align: center; margin-top: 24px;">
        <span style="color: var(--text-secondary); font-size: 0.9rem;">已有账号？</span>
        <router-link to="/login" style="color: var(--primary-500); font-weight: 500;">立即登录</router-link>
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
const form = ref({ username: "", email: "", password: "", confirmPassword: "" });
const error = ref("");
const loading = ref(false);

const handleRegister = async () => {
  error.value = "";
  if (form.value.password !== form.value.confirmPassword) {
    error.value = "两次密码输入不一致";
    return;
  }
  if (form.value.password.length < 6) {
    error.value = "密码至少6位";
    return;
  }
  loading.value = true;
  const result = await authStore.register({
    username: form.value.username,
    email: form.value.email,
    password: form.value.password,
  });
  loading.value = false;
  if (result.success) {
    showToast("注册成功！", "success");
    router.push("/");
  } else {
    error.value = result.error;
  }
};
</script>