<template>
  <div id="app-root">
    <router-view />
    <!-- Toast notifications -->
    <div v-if="toast.visible" class="toast" :class="`toast-${toast.type}`">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, provide } from "vue";

const toast = reactive({ visible: false, message: "", type: "info" });

const showToast = (message, type = "info", duration = 3000) => {
  toast.visible = true;
  toast.message = message;
  toast.type = type;
  setTimeout(() => {
    toast.visible = false;
  }, duration);
};

provide("showToast", showToast);
</script>
