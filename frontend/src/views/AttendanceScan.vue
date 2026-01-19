<template>
  <div class="attendance-scan">
    <!-- Header -->
    <header class="header">
      <button class="back-btn" @click="goBack">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <h1 class="title">Attendance Scan</h1>
    </header>

    <!-- Scanning Context -->
    <p class="scan-context">[ SCANNING FOR : {{ scanContext }} ]</p>

    <!-- Scanner Container -->
    <div class="scanner-container" @click="!isCameraActive && toggleCamera()">
      <!-- Camera View - Always in DOM, just hidden when not active -->
      <div class="camera-view" :class="{ 'active': isCameraActive }">
        <video ref="videoElement" class="camera-video" autoplay playsinline muted></video>
        <canvas ref="canvasElement" class="hidden-canvas"></canvas>
      </div>

      <!-- Scanner Frame Overlay -->
      <div class="scanner-frame" :class="{ 'scanning': isCameraActive }">
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

    <!-- Action Buttons -->
    <div class="action-buttons">
      <button 
        class="btn btn-flash" 
        :class="{ 'active': isFlashOn }"
        @click="toggleFlash"
        :disabled="!isCameraActive || !hasFlash"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 11 21 11 21z"/>
        </svg>
        Flash: {{ isFlashOn ? 'ON' : 'OFF' }}
      </button>

      <button class="btn btn-manual" @click="showManualInput = true">
        Enter Code Manually
      </button>
    </div>

    <!-- Camera Controls -->
    <div class="camera-controls">
      <button 
        class="btn btn-camera" 
        :class="{ 'stopping': isCameraActive }"
        @click="toggleCamera"
      >
        <svg v-if="!isCameraActive" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
          <circle cx="12" cy="13" r="4"></circle>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        </svg>
        {{ isCameraActive ? 'Stop Camera' : 'Start Camera' }}
      </button>

      <label class="btn btn-upload">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
        Upload QR Image
        <input 
          type="file" 
          accept="image/*" 
          class="file-input" 
          @change="handleImageUpload"
        />
      </label>
    </div>

    <!-- Manual Input Modal -->
    <div v-if="showManualInput" class="modal-overlay" @click.self="showManualInput = false">
      <div class="modal">
        <h2>Enter Attendance Code</h2>
        <input 
          v-model="manualCode" 
          type="text" 
          placeholder="Enter code here..."
          class="code-input"
          @keyup.enter="submitManualCode"
        />
        <div class="modal-buttons">
          <button class="btn btn-cancel" @click="showManualInput = false">Cancel</button>
          <button class="btn btn-submit" @click="submitManualCode">Submit</button>
        </div>
      </div>
    </div>

    <!-- Success/Error Toast -->
    <div v-if="toast.show" class="toast" :class="toast.type">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import jsQR from 'jsqr'

const router = useRouter()

// State
const scanContext = ref('IT-Project Management - ROOM 402')
const isCameraActive = ref(false)
const isFlashOn = ref(false)
const hasFlash = ref(false)
const showManualInput = ref(false)
const manualCode = ref('')
const toast = ref({ show: false, message: '', type: 'success' })

// Refs
const videoElement = ref<HTMLVideoElement | null>(null)
const canvasElement = ref<HTMLCanvasElement | null>(null)
let stream: MediaStream | null = null
let scanInterval: ReturnType<typeof setInterval> | null = null

// Navigation
const goBack = () => {
  router.back()
}

// Toast notification
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  toast.value = { show: true, message, type }
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

// Camera functions
const toggleCamera = async () => {
  if (isCameraActive.value) {
    stopCamera()
  } else {
    await startCamera()
  }
}

const startCamera = async () => {
  try {
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    }

    stream = await navigator.mediaDevices.getUserMedia(constraints)
    
    // Set camera active first so the video element renders
    isCameraActive.value = true
    
    // Wait for DOM to update
    await nextTick()
    
    if (videoElement.value && stream) {
      videoElement.value.srcObject = stream
      
      // Wait for video to be ready
      videoElement.value.onloadedmetadata = () => {
        videoElement.value?.play()
      }

      // Check for flash support
      const track = stream.getVideoTracks()[0]
      if (track) {
        const capabilities = track.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean }
        hasFlash.value = capabilities?.torch === true
      }

      // Start scanning for QR codes
      startScanning()
    }
  } catch (error) {
    console.error('Camera access error:', error)
    isCameraActive.value = false
    showToast('Unable to access camera. Please check permissions.', 'error')
  }
}

const stopCamera = () => {
  // Stop all tracks
  if (stream) {
    stream.getTracks().forEach(track => {
      track.stop()
    })
    stream = null
  }
  
  // Clear the video source
  if (videoElement.value) {
    videoElement.value.srcObject = null
  }
  
  // Clear scanning interval
  if (scanInterval) {
    clearInterval(scanInterval)
    scanInterval = null
  }
  
  isCameraActive.value = false
  isFlashOn.value = false
  hasFlash.value = false
}

const toggleFlash = async () => {
  if (!stream || !hasFlash.value) return

  const track = stream.getVideoTracks()[0]
  if (!track) return
  
  const newFlashState = !isFlashOn.value

  try {
    await track.applyConstraints({
      advanced: [{ torch: newFlashState } as MediaTrackConstraintSet]
    })
    isFlashOn.value = newFlashState
  } catch (error) {
    console.error('Flash toggle error:', error)
    showToast('Unable to toggle flash', 'error')
  }
}

// QR Code scanning
const startScanning = () => {
  if (scanInterval) clearInterval(scanInterval)

  scanInterval = setInterval(() => {
    scanQRCode()
  }, 250) // Scan every 250ms
}

const scanQRCode = () => {
  if (!videoElement.value || !canvasElement.value) return

  const video = videoElement.value
  const canvas = canvasElement.value
  const ctx = canvas.getContext('2d')

  if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return

  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const code = jsQR(imageData.data, imageData.width, imageData.height)

  if (code) {
    handleQRCodeDetected(code.data)
  }
}

const handleQRCodeDetected = (data: string) => {
  // Stop scanning temporarily
  if (scanInterval) {
    clearInterval(scanInterval)
    scanInterval = null
  }

  showToast(`QR Code detected: ${data}`, 'success')
  
  // Process the attendance code
  processAttendanceCode(data)
}

// Image upload handling
const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  try {
    const image = await loadImage(file)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    canvas.width = image.width
    canvas.height = image.height
    ctx.drawImage(image, 0, 0)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height)

    if (code) {
      handleQRCodeDetected(code.data)
    } else {
      showToast('No QR code found in the image', 'error')
    }
  } catch (error) {
    console.error('Image processing error:', error)
    showToast('Error processing image', 'error')
  }

  // Reset file input
  target.value = ''
}

const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Manual code submission
const submitManualCode = () => {
  if (!manualCode.value.trim()) {
    showToast('Please enter a code', 'error')
    return
  }

  processAttendanceCode(manualCode.value.trim())
  showManualInput.value = false
  manualCode.value = ''
}

// Process attendance code
const processAttendanceCode = (code: string) => {
  // TODO: Send code to backend for verification
  console.log('Processing attendance code:', code)
  showToast(`Attendance recorded: ${code}`, 'success')
  
  // Resume scanning after a delay
  setTimeout(() => {
    if (isCameraActive.value) {
      startScanning()
    }
  }, 2000)
}

// Lifecycle
onMounted(() => {
  // Optional: Auto-start camera on mount
  // startCamera()
})

onUnmounted(() => {
  stopCamera()
})
</script>

<style scoped>
.attendance-scan {
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
  padding: 0 0 24px 0;
}

/* Header */
.header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  margin-right: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.back-btn:hover {
  background: #f0f0f0;
}

.title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

/* Scan Context */
.scan-context {
  text-align: center;
  font-weight: 600;
  color: #333;
  padding: 20px;
  font-size: 0.95rem;
}

/* Scanner Container */
.scanner-container {
  position: relative;
  width: 280px;
  height: 280px;
  margin: 0 auto 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: #f0f0f0;
  border-radius: 12px;
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

/* Scanner Frame */
.scanner-frame {
  position: relative;
  width: 200px;
  height: 200px;
  z-index: 2;
}

.corner {
  position: absolute;
  width: 40px;
  height: 40px;
  border-color: #1a1a1a;
  border-style: solid;
  border-width: 0;
}

.scanning .corner {
  border-color: #1565c0;
}

.top-left {
  top: 0;
  left: 0;
  border-top-width: 4px;
  border-left-width: 4px;
}

.top-right {
  top: 0;
  right: 0;
  border-top-width: 4px;
  border-right-width: 4px;
}

.bottom-left {
  bottom: 0;
  left: 0;
  border-bottom-width: 4px;
  border-left-width: 4px;
}

.bottom-right {
  bottom: 0;
  right: 0;
  border-bottom-width: 4px;
  border-right-width: 4px;
}

/* Scan line animation */
.scan-line {
  position: absolute;
  left: 10%;
  width: 80%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #1565c0, transparent);
  animation: scan 2s linear infinite;
}

@keyframes scan {
  0% {
    top: 10%;
  }
  50% {
    top: 90%;
  }
  100% {
    top: 10%;
  }
}

.scanner-placeholder {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  height: 100%;
  color: #666;
  font-size: 0.9rem;
  z-index: 1;
}

.scanner-placeholder svg {
  opacity: 0.5;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  justify-content: space-between;
  padding: 0 20px;
  margin-bottom: 20px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.btn-flash {
  background: #1565c0;
  color: white;
  border: none;
}

.btn-flash:hover:not(:disabled) {
  background: #0d47a1;
}

.btn-flash:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-flash.active {
  background: #ffc107;
  color: #1a1a1a;
}

.btn-manual {
  background: white;
  color: #1565c0;
  border-color: #1565c0;
}

.btn-manual:hover {
  background: #e3f2fd;
}

/* Camera Controls */
.camera-controls {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 0 20px;
  flex-wrap: wrap;
}

.btn-camera {
  background: #4caf50;
  color: white;
  border: none;
}

.btn-camera:hover {
  background: #388e3c;
}

.btn-camera.stopping {
  background: #f44336;
}

.btn-camera.stopping:hover {
  background: #d32f2f;
}

.btn-upload {
  background: #ff9800;
  color: white;
  border: none;
  cursor: pointer;
}

.btn-upload:hover {
  background: #f57c00;
}

.file-input {
  display: none;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.modal {
  background: white;
  padding: 24px;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal h2 {
  margin: 0 0 20px 0;
  font-size: 1.25rem;
  color: #1a1a1a;
}

.code-input {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  margin-bottom: 20px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.code-input:focus {
  outline: none;
  border-color: #1565c0;
}

.modal-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
  border: none;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-submit {
  background: #1565c0;
  color: white;
  border: none;
}

.btn-submit:hover {
  background: #0d47a1;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  padding: 14px 24px;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  z-index: 200;
  animation: slideUp 0.3s ease;
}

.toast.success {
  background: #4caf50;
}

.toast.error {
  background: #f44336;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* Responsive Design */

/* Mobile devices (portrait) */
@media (max-width: 480px) {
  .header {
    padding: 12px 16px;
  }

  .title {
    font-size: 1.1rem;
  }

  .scan-context {
    padding: 16px;
    font-size: 0.85rem;
  }

  .scanner-container {
    width: min(280px, 90vw);
    height: min(280px, 90vw);
  }

  .scanner-frame {
    width: min(200px, 70vw);
    height: min(200px, 70vw);
  }

  .corner {
    width: 30px;
    height: 30px;
  }

  .action-buttons {
    flex-direction: column;
    gap: 10px;
    padding: 0 16px;
    margin-bottom: 16px;
  }

  .action-buttons .btn {
    width: 100%;
    justify-content: center;
    padding: 12px 16px;
    font-size: 0.85rem;
  }

  .camera-controls {
    flex-direction: column;
    gap: 10px;
    padding: 0 16px;
  }

  .camera-controls .btn {
    width: 100%;
    justify-content: center;
  }

  .modal {
    padding: 20px;
    margin: 0 16px;
  }

  .modal h2 {
    font-size: 1.1rem;
  }

  .toast {
    bottom: 80px;
    max-width: calc(100% - 32px);
    font-size: 0.9rem;
  }
}

/* Small mobile devices */
@media (max-width: 360px) {
  .scanner-container {
    width: 240px;
    height: 240px;
  }

  .scanner-frame {
    width: 180px;
    height: 180px;
  }

  .btn {
    font-size: 0.8rem;
    padding: 10px 14px;
  }
}

/* Tablets and small laptops */
@media (min-width: 481px) and (max-width: 767px) {
  .scanner-container {
    width: 300px;
    height: 300px;
  }

  .scanner-frame {
    width: 220px;
    height: 220px;
  }

  .action-buttons,
  .camera-controls {
    padding: 0 24px;
  }
}

/* Desktop and larger tablets */
@media (min-width: 768px) {
  .attendance-scan {
    max-width: 600px;
    margin: 0 auto;
    min-height: 100vh;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
    background: white;
  }

  .scanner-container {
    width: 320px;
    height: 320px;
  }

  .scanner-frame {
    width: 240px;
    height: 240px;
  }

  .action-buttons,
  .camera-controls {
    padding: 0 32px;
  }

  .btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .scanner-container:hover {
    transform: scale(1.02);
    transition: transform 0.2s;
  }
}

/* Large desktops */
@media (min-width: 1200px) {
  .attendance-scan {
    max-width: 700px;
  }

  .scanner-container {
    width: 360px;
    height: 360px;
  }

  .scanner-frame {
    width: 280px;
    height: 280px;
  }
}

/* Landscape orientation on mobile */
@media (max-width: 767px) and (orientation: landscape) {
  .attendance-scan {
    padding-bottom: 16px;
  }

  .scan-context {
    padding: 12px;
  }

  .scanner-container {
    width: 220px;
    height: 220px;
    margin: 0 auto 20px;
  }

  .scanner-frame {
    width: 160px;
    height: 160px;
  }

  .action-buttons,
  .camera-controls {
    flex-direction: row;
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  .action-buttons .btn,
  .camera-controls .btn {
    width: auto;
    flex: 1;
    min-width: 140px;
  }
}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  .btn {
    min-height: 44px;
    touch-action: manipulation;
  }

  .back-btn {
    min-width: 44px;
    min-height: 44px;
  }

  .scanner-container {
    cursor: default;
  }
}

/* High DPI screens */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .scanner-frame {
    border-radius: 2px;
  }

  .corner {
    border-width: 0;
  }

  .scanning .corner {
    border-color: #1565c0;
  }

  .top-left {
    border-top-width: 3px;
    border-left-width: 3px;
  }

  .top-right {
    border-top-width: 3px;
    border-right-width: 3px;
  }

  .bottom-left {
    border-bottom-width: 3px;
    border-left-width: 3px;
  }

  .bottom-right {
    border-bottom-width: 3px;
    border-right-width: 3px;
  }
}
</style>
