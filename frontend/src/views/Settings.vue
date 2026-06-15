<template>
  <AppLayout>
    <div class="page-header">
      <div>
        <h1 class="page-title">设置</h1>
        <p class="page-subtitle">管理你的账户与个性化配置</p>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div class="card">
        <div class="card-header"><span class="card-title">用户信息</span></div>
        <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 20px;">
          <div style="width: 72px; height: 72px; border-radius: 50%; background: var(--primary-100); display: flex; align-items: center; justify-content: center; font-size: 2rem; color: var(--primary-600); font-weight: 700; flex-shrink: 0; overflow: hidden; position: relative;">
            <img v-if="avatarUrl" :src="avatarUrl" style="width: 100%; height: 100%; object-fit: cover;" />
            <span v-else>{{ (authStore.username || "U")[0].toUpperCase() }}</span>
          </div>
          <div>
            <div style="font-weight: 600; font-size: 1.1rem;">{{ authStore.username }}</div>
            <div style="font-size: 0.85rem; color: var(--text-secondary);">{{ userEmail }}</div>
            <button class="btn btn-sm btn-outline" style="margin-top: 8px;" @click="showAvatarModal = true">修改头像</button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">登录邮箱</label>
          <div style="display: flex; gap: 8px;">
            <input v-model="emailForm" class="form-input" placeholder="当前邮箱" />
            <button class="btn btn-sm btn-outline" @click="showToast('换绑功能开发中', 'info')">换绑</button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">个人档案</label>
          <router-link to="/profile" class="btn btn-outline btn-sm">查看/编辑档案</router-link>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">每个月结束后可在此修改你的健康档案</p>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title">地区与路线</span></div>
        <div class="form-group">
          <label class="form-label">所在地区</label>
          <div style="display: flex; gap: 8px; align-items: center;">
            <input v-model="region" class="form-input" placeholder="例如: 北京市" />
            <button class="btn btn-sm btn-outline" @click="autoDetectRegion">自动定位</button>
          </div>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">当前: {{ region || "未设置" }}</p>
        </div>
        <div class="form-group">
          <label class="form-label">户外运动路线</label>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px;">自定义户外跑步/骑行路线（需调用地图 API）</p>
          <button class="btn btn-outline btn-sm" @click="showToast('地图API功能开发中', 'info')">添加路线</button>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title">界面外观</span></div>
        <div class="form-group">
          <label class="form-label">字体大小</label>
          <select v-model="fontSize" class="form-select" @change="applySettings">
            <option value="small">小</option>
            <option value="medium" selected>中</option>
            <option value="large">大</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">主题颜色</label>
          <div style="display: flex; gap: 12px;">
            <div v-for="c in themeColors" :key="c.name" style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
              <button :style="{ width: selectedTheme === c.name ? '40px' : '36px', height: selectedTheme === c.name ? '40px' : '36px', borderRadius: '50%', border: selectedTheme === c.name ? '3px solid var(--gray-800)' : '3px solid transparent', cursor: 'pointer', background: c.color }" @click="selectTheme(c.name)"></button>
              <span style="font-size: 0.7rem; color: var(--text-muted);">{{ c.label }}</span>
            </div>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">界面语言</label>
          <select v-model="language" class="form-select" @change="applySettings">
            <option value="zh-CN">简体中文</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      <div class="card">
        <!-- Avatar upload modal -->
        <div v-if="showAvatarModal" class="modal-overlay" @click.self="showAvatarModal = false">
          <div class="modal-content" style="max-width: 380px;">
            <div class="modal-header">
              <span class="modal-title">修改头像</span>
              <button class="modal-close" @click="showAvatarModal = false">x</button>
            </div>
            <div style="text-align: center; padding: 16px 0;">
              <div style="width: 120px; height: 120px; border-radius: 50%; margin: 0 auto 20px; background: var(--primary-100); overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 3rem; color: var(--primary-600);">
                <img v-if="avatarUrl" :src="avatarUrl" style="width: 100%; height: 100%; object-fit: cover;" />
                <span v-else>{{ (authStore.username || "U")[0].toUpperCase() }}</span>
              </div>
              <input ref="fileInput" type="file" accept="image/*" style="display: none;" @change="handleFileSelect" />
              <button class="btn btn-primary" @click="$refs.fileInput.click()">选择图片上传</button>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 12px;">支持 JPG、PNG 格式，建议 200x200 像素</p>
            </div>
          </div>
        </div>
        <div class="card-header"><span class="card-title">账户操作</span></div>
        <div style="display: flex; flex-direction: column; gap: 12px; padding: 8px 0;">
          <button class="btn btn-outline" style="width: 100%; justify-content: center;" @click="showToast('修改密码功能开发中', 'info')">修改密码</button>
          <button class="btn btn-outline" style="width: 100%; justify-content: center; color: var(--danger); border-color: var(--danger);" @click="showToast('账号注销功能开发中', 'info')">注销账号</button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, inject, onMounted } from "vue";
import AppLayout from "../components/AppLayout.vue";
import { useAuthStore } from "../store/auth.js";

const authStore = useAuthStore();
const showToast = inject("showToast");

const userEmail = ref("");
const emailForm = ref("");
const region = ref(localStorage.getItem("userRegion") || "");
const fontSize = ref(localStorage.getItem("fontSize") || "medium");
const language = ref(localStorage.getItem("language") || "zh-CN");
const selectedTheme = ref(localStorage.getItem("themeColor") || "orange");
const showAvatarModal = ref(false);

const themeColors = [
  { name: "default", color: "#f97316", label: "默认" },
  { name: "rose", color: "#efafad", label: "玫瑰粉" },
  { name: "peach", color: "#f0945d", label: "蜜桃橙" },
  { name: "warmgray", color: "#c1b2a3", label: "暖灰" },
  { name: "sage", color: "#b7d07a", label: "草绿" },
  { name: "sky", color: "#8abcd1", label: "天蓝" },
];

const autoDetectRegion = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        region.value = "纬度: " + pos.coords.latitude.toFixed(2) + ", 经度: " + pos.coords.longitude.toFixed(2);
        localStorage.setItem("userRegion", region.value);
        showToast("定位成功", "success");
      },
      () => showToast("定位失败，请手动输入", "error")
    );
  } else {
    showToast("浏览器不支持定位", "error");
  }
};

const selectTheme = (name) => {
  selectedTheme.value = name;
  localStorage.setItem("themeColor", name);
  applySettings();
};

const applySettings = () => {
  localStorage.setItem("fontSize", fontSize.value);
  localStorage.setItem("language", language.value);
  const root = document.documentElement;
  if (fontSize.value === "small") root.style.fontSize = "14px";
  else if (fontSize.value === "large") root.style.fontSize = "18px";
  else root.style.fontSize = "16px";
  showToast("设置已保存", "success");
};

const avatarUrl = ref(localStorage.getItem("userAvatar") || "");
const fileInput = ref(null);

const handleFileSelect = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    avatarUrl.value = reader.result;
    localStorage.setItem("userAvatar", reader.result);
    showAvatarModal.value = false;
    showToast("头像已更新", "success");
  };
  reader.readAsDataURL(file);
};

onMounted(() => {
  authStore.loadUser().then(() => {
    userEmail.value = authStore.user?.email || "";
    emailForm.value = authStore.user?.email || "";
  });
  // Apply saved theme
  const savedTheme = localStorage.getItem("themeColor");
  if (savedTheme && savedTheme !== "default") {
    selectedTheme.value = savedTheme;
    applySettings();
  }
});
</script>

<style scoped>
.btn.selected {
  border-color: var(--gray-800) !important;
  box-shadow: 0 0 0 2px white, 0 0 0 4px currentColor;
}
</style>