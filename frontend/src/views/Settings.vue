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
        <div class="card-header"><span class="card-title">设备管理</span></div>
        <div v-if="devices.length === 0" style="text-align: center; padding: 32px 0; color: var(--text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">⌚</div>
          <p>尚未绑定智能手环</p>
          <p style="font-size: 0.85rem; margin-top: 4px;">绑定后可同步心率、步数、睡眠等健康数据</p>
          <button class="btn btn-primary" style="margin-top: 16px;" @click="showBindModal = true">绑定智能手环</button>
        </div>
        <div v-else v-for="d in devices" :key="d.id" style="padding: 8px 0;">
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: var(--gray-50); border-radius: var(--radius-sm);">
            <div>
              <div style="font-weight: 600;">{{ d.name }}</div>
              <div style="font-size: 0.8rem; color: var(--text-secondary);">最后同步: {{ formatTime(d.lastSync) }}</div>
            </div>
            <button class="btn btn-sm btn-outline" style="color: var(--danger); border-color: var(--danger);" @click="unbindDevice(d.id)">解缚</button>
          </div>
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

    <div v-if="showBindModal" class="modal-overlay" @click.self="showBindModal = false">
      <div class="modal-content" style="max-width: 400px;">
        <div class="modal-header">
          <span class="modal-title">绑定智能手环</span>
          <button class="modal-close" @click="showBindModal = false">x</button>
        </div>
        <div style="padding: 16px 0;">
          <div class="form-group">
            <label class="form-label">设备名称</label>
            <input v-model="bindDeviceName" class="form-input" placeholder="例如: 我的智能手环" />
          </div>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 16px;">
            绑定后系统将自动生成设备密钥。你可以在智能手环中配置此密钥以上传数据。
          </p>
          <button class="btn btn-primary" style="width: 100%;" @click="bindDevice">绑定设备</button>
        </div>
      </div>
    </div>

    <div v-if="showTargetModal" class="modal-overlay" @click.self="showTargetModal = false">
      <div class="modal-content" style="max-width: 420px;">
        <div class="modal-header">
          <span class="modal-title">调整目标指标</span>
          <button class="modal-close" @click="showTargetModal = false">x</button>
        </div>
        <div style="padding: 8px 0;">
          <div v-for="(goal, key) in targetGoals" :key="key" class="form-group">
            <label class="form-label">{{ goal.label }}</label>
            <div style="display: flex; align-items: center; gap: 12px;">
              <input v-model.number="goal.value" type="number" class="form-input" :min="goal.min" :max="goal.max" />
              <span style="font-size: 0.85rem; color: var(--text-secondary); white-space: nowrap;">{{ goal.unit }}</span>
            </div>
          </div>
          <button class="btn btn-primary" style="width: 100%; margin-top: 16px;" @click="saveTargets">保存目标</button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, inject, onMounted } from "vue";
import AppLayout from "../components/AppLayout.vue";
import { useAuthStore } from "../store/auth.js";
import { deviceAPI } from "../api/index.js";

const authStore = useAuthStore();
const showToast = inject("showToast");

const userEmail = ref("");
const emailForm = ref("");
const region = ref(localStorage.getItem("userRegion") || "");
const fontSize = ref(localStorage.getItem("fontSize") || "medium");
const language = ref(localStorage.getItem("language") || "zh-CN");
const selectedTheme = ref(localStorage.getItem("themeColor") || "orange");
const showAvatarModal = ref(false);
const devices = ref([]);
const showBindModal = ref(false);
const bindDeviceName = ref("");

const themeColors = [
  { name: "default", color: "#f97316", label: "\u9ed8\u8ba4" },
  { name: "rose", color: "#efafad", label: "\u73ab\u7470\u7c89" },
  { name: "peach", color: "#f0945d", label: "\u871c\u6843\u6a59" },
  { name: "warmgray", color: "#c1b2a3", label: "\u6696\u7070" },
  { name: "sage", color: "#b7d07a", label: "\u8349\u7eff" },
  { name: "sky", color: "#8abcd1", label: "\u5929\u84dd" },
];

const autoDetectRegion = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        region.value = "\u7eac\u5ea6: " + pos.coords.latitude.toFixed(2) + ", \u7ecf\u5ea6: " + pos.coords.longitude.toFixed(2);
        localStorage.setItem("userRegion", region.value);
        showToast("\u5b9a\u4f4d\u6210\u529f", "success");
      },
      () => showToast("\u5b9a\u4f4d\u5931\u8d25\uff0c\u8bf7\u624b\u52a8\u8f93\u5165", "error")
    );
  } else {
    showToast("\u6d4f\u89c8\u5668\u4e0d\u652f\u6301\u5b9a\u4f4d", "error");
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
  showToast("\u8bbe\u7f6e\u5df2\u4fdd\u5b58", "success");
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
    showToast("\u5934\u50cf\u5df2\u66f4\u65b0", "success");
  };
  reader.readAsDataURL(file);
};

const targetGoals = reactive({
  calorie: { label: "\u6bcf\u65e5\u5361\u8def\u91cc\u76ee\u6807", value: 600, unit: "\u5343\u5361", min: 100, max: 5000 },
  steps: { label: "\u6bcf\u65e5\u6b65\u6570\u76ee\u6807", value: 6000, unit: "\u6b65", min: 1000, max: 50000 },
  activities: { label: "\u6bcf\u65e5\u6d3b\u52a8\u6b21\u6570\u76ee\u6807", value: 10, unit: "\u6b21", min: 1, max: 50 },
});

const loadDevices = async () => {
  try {
    const { data } = await deviceAPI.list();
    devices.value = data.devices || [];
  } catch (err) {
    console.error("Load devices error:", err);
  }
};

const bindDevice = async () => {
  try {
    const { data } = await deviceAPI.bind({ deviceName: bindDeviceName.value || "\u667a\u80fd\u624b\u73af" });
    showToast("\u8bbe\u5907\u7ed1\u5b9a\u6210\u529f\uff01\u8bbe\u5907\u5bc6\u94a5: " + data.device.key, "success");
    showBindModal.value = false;
    bindDeviceName.value = "";
    await loadDevices();
  } catch (err) {
    showToast(err.response?.data?.error || "\u7ed1\u5b9a\u5931\u8d25", "error");
  }
};

const unbindDevice = async (id) => {
  try {
    await deviceAPI.unbind(id);
    showToast("\u8bbe\u5907\u5df2\u89e3\u7f1a", "info");
    await loadDevices();
  } catch (err) {
    showToast(err.response?.data?.error || "\u89e3\u7f1a\u5931\u8d25", "error");
  }
};

const formatTime = (dateStr) => {
  if (!dateStr) return "\u672a\u540c\u6b65";
  const d = new Date(dateStr);
  return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0") + " " + String(d.getHours()).padStart(2,"0") + ":" + String(d.getMinutes()).padStart(2,"0");
};

const saveTargets = () => {
  localStorage.setItem("dailyTargets_calorie", targetGoals.calorie.value);
  localStorage.setItem("dailyTargets_steps", targetGoals.steps.value);
  localStorage.setItem("dailyTargets_activities", targetGoals.activities.value);
  localStorage.setItem("dailyTargets", JSON.stringify({
    calorie: targetGoals.calorie.value,
    steps: targetGoals.steps.value,
    activities: targetGoals.activities.value,
  }));
  showTargetModal.value = false;
  showToast("\u76ee\u6807\u5df2\u4fdd\u5b58", "success");
  window.dispatchEvent(new CustomEvent("targets-updated"));
};

onMounted(() => {
  authStore.loadUser().then(() => {
    userEmail.value = authStore.user?.email || "";
    emailForm.value = authStore.user?.email || "";
  });
  const savedTheme = localStorage.getItem("themeColor");
  if (savedTheme && savedTheme !== "default") {
    selectedTheme.value = savedTheme;
    applySettings();
  }
  loadDevices();
});
</script>
<style scoped>
.btn.selected {
  border-color: var(--gray-800) !important;
  box-shadow: 0 0 0 2px white, 0 0 0 4px currentColor;
}
</style>