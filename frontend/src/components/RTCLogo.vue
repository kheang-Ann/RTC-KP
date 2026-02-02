<template>
  <div class="logo-container" :class="{ large: size === 'large', small: size === 'small' }">
    <svg class="logo-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGradientComponent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color: #3b82f6; stop-opacity: 1" />
          <stop offset="100%" style="stop-color: #2563eb; stop-opacity: 1" />
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="80" height="80" rx="16" fill="url(#logoGradientComponent)" />
      <text 
        x="50" 
        y="65" 
        font-family="Poppins, Arial" 
        font-size="36" 
        font-weight="bold" 
        fill="white" 
        text-anchor="middle" 
        dominant-baseline="middle"
      >
        RTC
      </text>
    </svg>
    <div v-if="showText" class="logo-text">
      <div class="logo-title">RTC-KP</div>
      <div class="logo-subtitle">School Management System</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  size?: 'small' | 'medium' | 'large'
  showText?: boolean
}>()
</script>

<style scoped>
.logo-container {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.logo-container.small {
  gap: 8px;
}

.logo-container.large {
  gap: 16px;
}

.logo-svg {
  width: 48px;
  height: 48px;
  filter: drop-shadow(0 2px 4px rgba(59, 130, 246, 0.1));
}

.logo-container.small .logo-svg {
  width: 40px;
  height: 40px;
}

.logo-container.large .logo-svg {
  width: 60px;
  height: 60px;
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.logo-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
  letter-spacing: -0.5px;
}

.logo-container.small .logo-title {
  font-size: 14px;
}

.logo-container.large .logo-title {
  font-size: 24px;
}

.logo-subtitle {
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
  line-height: 1.2;
}

.logo-container.small .logo-subtitle {
  font-size: 10px;
}

.logo-container.large .logo-subtitle {
  font-size: 12px;
}
</style>
