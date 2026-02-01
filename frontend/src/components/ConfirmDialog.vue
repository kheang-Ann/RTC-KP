<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="handleCancel">
        <div class="modal-container">
          <div class="modal-header">
            <h3 class="modal-title">{{ title }}</h3>
          </div>
          <div class="modal-body">
            <p>{{ message }}</p>
          </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="handleCancel"
              ref="cancelButton"
            >
              {{ cancelText }}
            </button>
            <button 
              type="button" 
              class="btn btn-danger" 
              @click="handleConfirm"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

interface Props {
  show: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Confirm Action',
  confirmText: 'Delete',
  cancelText: 'Cancel'
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const cancelButton = ref<HTMLButtonElement>()

watch(() => props.show, (newVal) => {
  if (newVal) {
    nextTick(() => {
      cancelButton.value?.focus()
    })
  }
})

function handleConfirm() {
  emit('confirm')
}

function handleCancel() {
  emit('cancel')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(2px);
}

.modal-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 10px 20px rgba(0, 0, 0, 0.15);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  animation: slideDown 0.3s ease-out;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}

.modal-body {
  padding: 24px;
  color: #4b5563;
  font-size: 1rem;
  line-height: 1.5;
}

.modal-body p {
  margin: 0;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background-color: #f9fafb;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background-color: #e5e7eb;
  color: #374151;
}

.btn-secondary:hover {
  background-color: #d1d5db;
}

.btn-danger {
  background-color: #dc2626;
  color: white;
}

.btn-danger:hover {
  background-color: #b91c1c;
}

.btn:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Transition animations */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container {
  animation: slideDown 0.3s ease-out;
}

.modal-leave-active .modal-container {
  animation: slideUp 0.3s ease-in;
}

@keyframes slideDown {
  from {
    transform: translateY(-50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(-50px);
    opacity: 0;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .modal-container {
    background-color: #1f2937;
  }

  .modal-header {
    border-bottom-color: #374151;
  }

  .modal-title {
    color: #f9fafb;
  }

  .modal-body {
    color: #d1d5db;
  }

  .modal-footer {
    border-top-color: #374151;
    background-color: #111827;
  }

  .btn-secondary {
    background-color: #374151;
    color: #d1d5db;
  }

  .btn-secondary:hover {
    background-color: #4b5563;
  }
}
</style>
