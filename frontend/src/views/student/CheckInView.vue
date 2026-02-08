<script setup lang="ts">
import { ref, computed, onUnmounted, nextTick } from 'vue'
import { attendanceService } from '@/services/attendance'
import { isValidAttendanceCode } from '@/utils/validation'
import jsQR from 'jsqr'

const code = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)
const checkInResult = ref<{ courseName?: string; sessionTitle?: string } | null>(null)

// Tab state: 'code' or 'scan'
const activeTab = ref<'code' | 'scan'>('code')

// QR Scanner state
const isCameraActive = ref(false)
const videoElement = ref<HTMLVideoElement | null>(null)
const canvasElement = ref<HTMLCanvasElement | null>(null)
let stream: MediaStream | null = null
let scanInterval: ReturnType<typeof setInterval> | null = null

// Real-time validation
const codeError = computed(() => {
  if (!code.value.trim()) return ''
  return isValidAttendanceCode(code.value) || ''
})

const isCodeValid = computed(() => {
  return code.value.trim() !== '' && !isValidAttendanceCode(code.value)
})

async function handleCheckIn() {
  // Validate before submission
  const validationError = isValidAttendanceCode(code.value)
  if (validationError) {
    error.value = validationError
    return
  }

  loading.value = true
  error.value = ''
  success.value = false

  try {
    const result = await attendanceService.checkIn(code.value.trim().toUpperCase())
    success.value = true
    checkInResult.value = {
      courseName: result.session?.course?.name || result.session?.courseId,
      sessionTitle: result.session?.title || 'Session',
    }
    code.value = ''
  } catch (e) {
    error.value = (e as Error).message || 'Failed to check in. Please check the code and try again.'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  code.value = ''
  error.value = ''
  success.value = false
  checkInResult.value = null
  stopCamera()
}

// QR Scanner functions
async function startCamera() {
  try {
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    }

    stream = await navigator.mediaDevices.getUserMedia(constraints)
    isCameraActive.value = true
    
    await nextTick()
    
    if (videoElement.value && stream) {
      videoElement.value.srcObject = stream
      videoElement.value.onloadedmetadata = () => {
        videoElement.value?.play()
      }
      startScanning()
    }
  } catch (err) {
    console.error('Camera access error:', err)
    isCameraActive.value = false
    error.value = 'Unable to access camera. Please check permissions or enter code manually.'
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop())
    stream = null
  }
  
  if (videoElement.value) {
    videoElement.value.srcObject = null
  }
  
  if (scanInterval) {
    clearInterval(scanInterval)
    scanInterval = null
  }
  
  isCameraActive.value = false
}

function startScanning() {
  if (scanInterval) clearInterval(scanInterval)
  scanInterval = setInterval(scanQRCode, 250)
}

function scanQRCode() {
  if (!videoElement.value || !canvasElement.value) return

  const video = videoElement.value
  const canvas = canvasElement.value
  const ctx = canvas.getContext('2d')

  if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return

  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const qrCode = jsQR(imageData.data, imageData.width, imageData.height)

  if (qrCode) {
    handleQRCodeDetected(qrCode.data)
  }
}

async function handleQRCodeDetected(data: string) {
  if (scanInterval) {
    clearInterval(scanInterval)
    scanInterval = null
  }

  loading.value = true
  error.value = ''

  try {
    const result = await attendanceService.checkIn(data.toUpperCase())
    success.value = true
    checkInResult.value = {
      courseName: result.session?.course?.name || result.session?.courseId,
      sessionTitle: result.session?.title || 'Session',
    }
    stopCamera()
  } catch (e) {
    error.value = (e as Error).message || 'Failed to check in. Please check the code and try again.'
    // Resume scanning after error
    setTimeout(() => {
      if (isCameraActive.value) {
        startScanning()
      }
    }, 2000)
  } finally {
    loading.value = false
  }
}

function switchTab(tab: 'code' | 'scan') {
  activeTab.value = tab
  error.value = ''
  if (tab === 'code') {
    stopCamera()
  }
}

onUnmounted(() => {
  stopCamera()
})
</script>

<template>
  <div class="check-in-page">
    <h1>Check In</h1>
    <p class="subtitle">Enter the attendance code or scan QR code</p>

    <div class="check-in-card">
      <!-- Success State -->
      <div v-if="success" class="success-state">
        <div class="success-icon">✓</div>
        <h2>Check-in Successful!</h2>
        <p v-if="checkInResult?.courseName" class="success-course">{{ checkInResult.courseName }}</p>
        <p v-if="checkInResult?.sessionTitle" class="success-session">{{ checkInResult.sessionTitle }}</p>
        <p>Your attendance has been recorded.</p>
        <button class="btn btn-primary" @click="resetForm">Check In Again</button>
      </div>

      <!-- Check-in Options -->
      <div v-else>
        <!-- Tab Switcher -->
        <div class="tab-switcher">
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'code' }"
            @click="switchTab('code')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="9" x2="15" y2="9"></line>
              <line x1="9" y1="13" x2="15" y2="13"></line>
              <line x1="9" y1="17" x2="11" y2="17"></line>
            </svg>
            Enter Code
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'scan' }"
            @click="switchTab('scan')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
            Scan QR
          </button>
        </div>

        <div v-if="error" class="alert alert-error">{{ error }}</div>

        <!-- Enter Code Tab -->
        <div v-if="activeTab === 'code'" class="tab-content">
          <form @submit.prevent="handleCheckIn">
            <div class="code-input-wrapper">
              <input
                v-model="code"
                type="text"
                class="code-input"
                :class="{ 'input-error': codeError, 'input-valid': isCodeValid }"
                placeholder="Enter 6-digit code"
                maxlength="8"
                autocomplete="off"
                :disabled="loading"
              />
              <p v-if="codeError" class="field-error">{{ codeError }}</p>
            </div>

            <button type="submit" class="btn btn-primary btn-block" :disabled="loading || !isCodeValid">
              {{ loading ? 'Checking in...' : 'Check In' }}
            </button>
          </form>
        </div>

        <!-- Scan QR Tab -->
        <div v-if="activeTab === 'scan'" class="tab-content">
          <div class="scanner-container" @click="!isCameraActive && startCamera()">
            <!-- Camera View -->
            <div class="camera-view" :class="{ active: isCameraActive }">
              <video ref="videoElement" class="camera-video" autoplay playsinline muted></video>
              <canvas ref="canvasElement" class="hidden-canvas"></canvas>
            </div>

            <!-- Scanner Frame Overlay -->
            <div class="scanner-frame" :class="{ scanning: isCameraActive }">
              <div class="corner top-left"></div>
              <div class="corner top-right"></div>
              <div class="corner bottom-left"></div>
              <div class="corner bottom-right"></div>
              <div v-if="isCameraActive" class="scan-line"></div>
            </div>

            <!-- Placeholder when camera is not active -->
            <div v-if="!isCameraActive" class="scanner-placeholder">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
              <p>Tap to start camera</p>
            </div>
          </div>

          <!-- Camera Control -->
          <button 
            v-if="isCameraActive" 
            class="btn btn-secondary btn-block" 
            @click="stopCamera"
          >
            Stop Camera
          </button>

          <p class="scan-hint">Position the QR code within the frame</p>
        </div>

        <div class="tips">
          <h3>Tips</h3>
          <ul>
            <li>The code is case-insensitive</li>
            <li>Ask your teacher if you don't have the code</li>
            <li>Make sure you're checking in during the class session</li>
          </ul>
        </div>
      </div>
    </div>

    <router-link to="/student/dashboard" class="back-link">← Back to Dashboard</router-link>
  </div>
</template>

<style scoped>
.check-in-page {
  padding: 1rem;
  max-width: 500px;
  margin: 0 auto;
}

h1 {
  text-align: center;
  margin-bottom: 0.25rem;
}

.subtitle {
  text-align: center;
  color: var(--color-grey);
  margin-bottom: 2rem;
}

.check-in-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Tab Switcher */
.tab-switcher {
  display: flex;
  gap: 8px;
  margin-bottom: 1.5rem;
  background: #f5f5f5;
  padding: 4px;
  border-radius: 10px;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  color: #333;
}

.tab-btn.active {
  background: white;
  color: #007bff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tab-btn svg {
  flex-shrink: 0;
}

.tab-content {
  margin-bottom: 1.5rem;
}

.code-input-wrapper {
  margin-bottom: 1.5rem;
}

.code-input {
  width: 90%;
  padding: 1rem;
  font-size: 2rem;
  text-align: center;
  letter-spacing: 0.5rem;
  text-transform: uppercase;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-family: monospace;
  transition: border-color 0.2s;
}

.code-input:focus {
  outline: none;
  border-color: #007bff;
}

.code-input.input-error {
  border-color: #dc3545;
}

.code-input.input-valid {
  border-color: #28a745;
}

.field-error {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  text-align: center;
}

.code-input::placeholder {
  font-size: 1rem;
  letter-spacing: normal;
}

/* Scanner Styles */
.scanner-container {
  position: relative;
  width: 250px;
  height: 250px;
  margin: 0 auto 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: #f8f9fa;
  border-radius: 12px;
  overflow: hidden;
}

.camera-view {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 12px;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s, visibility 0.3s;
}

.camera-view.active {
  opacity: 1;
  visibility: visible;
}

.camera-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #000;
}

.hidden-canvas {
  display: none;
}

.scanner-frame {
  position: relative;
  width: 180px;
  height: 180px;
  z-index: 2;
}

.corner {
  position: absolute;
  width: 30px;
  height: 30px;
  border-color: #aaa;
  border-style: solid;
  border-width: 0;
}

.scanning .corner {
  border-color: #007bff;
}

.top-left {
  top: 0;
  left: 0;
  border-top-width: 3px;
  border-left-width: 3px;
  border-top-left-radius: 4px;
}

.top-right {
  top: 0;
  right: 0;
  border-top-width: 3px;
  border-right-width: 3px;
  border-top-right-radius: 4px;
}

.bottom-left {
  bottom: 0;
  left: 0;
  border-bottom-width: 3px;
  border-left-width: 3px;
  border-bottom-left-radius: 4px;
}

.bottom-right {
  bottom: 0;
  right: 0;
  border-bottom-width: 3px;
  border-right-width: 3px;
  border-bottom-right-radius: 4px;
}

.scan-line {
  position: absolute;
  left: 10%;
  width: 80%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #007bff, transparent);
  animation: scan 2s linear infinite;
}

@keyframes scan {
  0% { top: 10%; }
  50% { top: 90%; }
  100% { top: 10%; }
}

.scanner-placeholder {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #888;
  z-index: 1;
}

.scanner-placeholder svg {
  opacity: 0.6;
}

.scanner-placeholder p {
  font-size: 0.875rem;
  margin: 0;
}

.scan-hint {
  text-align: center;
  color: #888;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

/* Buttons */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
}

.btn-block {
  width: 100%;
}

/* Success State */
.success-state {
  text-align: center;
  padding: 1rem;
}

.success-icon {
  width: 80px;
  height: 80px;
  background: #28a745;
  color: white;
  font-size: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.success-state h2 {
  color: #28a745;
  margin-bottom: 0.5rem;
}

.success-state p {
  color: var(--color-grey);
  margin-bottom: 0.5rem;
}

.success-course {
  font-weight: 600;
  color: #333 !important;
  font-size: 1.1rem;
}

.success-session {
  color: #666 !important;
  font-size: 0.95rem;
}

.success-state .btn {
  margin-top: 1rem;
}

/* Tips */
.tips {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
}

.tips h3 {
  font-size: 0.875rem;
  color: var(--color-grey);
  margin-bottom: 0.5rem;
}

.tips ul {
  margin: 0;
  padding-left: 1.25rem;
  color: #888;
  font-size: 0.875rem;
}

.tips li {
  margin-bottom: 0.25rem;
}

/* Alert */
.alert {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.alert-error {
  background: #f8d7da;
  color: #721c24;
}

/* Back Link */
.back-link {
  display: block;
  text-align: center;
  margin-top: 1.5rem;
  color: #007bff;
  text-decoration: none;
}

.back-link:hover {
  text-decoration: underline;
}
</style>
