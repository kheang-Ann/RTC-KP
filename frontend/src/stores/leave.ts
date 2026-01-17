import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import leaveApi from '@/services/leaveApi.service'

export interface Leave {
  id: string
  employeeId: string
  employeeName: string
  type: 'sick' | 'annual' | 'personal' | 'emergency' | 'unpaid'
  startDate: string
  endDate: string
  days: number
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  documents?: string[]
  reviewedBy?: string
  reviewedAt?: string
  reviewComments?: string
  createdAt: string
  updatedAt: string
}

export const useLeaveStore = defineStore('leave', () => {
  const leaves = ref<Leave[]>([])
  const currentLeave = ref<Leave | null>(null)
  const leaveBalance = ref<any>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const allLeaves = computed(() => leaves.value)
  const pendingLeaves = computed(() => leaves.value.filter((l) => l.status === 'pending'))
  const approvedLeaves = computed(() => leaves.value.filter((l) => l.status === 'approved'))

  async function fetchLeaves(filters = {}) {
    loading.value = true
    error.value = null
    try {
      const data = await leaveApi.getAllLeaves(filters)
      leaves.value = data
      return data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchLeave(id: string) {
    loading.value = true
    error.value = null
    try {
      const data = await leaveApi.getLeave(id)
      currentLeave.value = data
      return data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createLeave(leaveData: any) {
    loading.value = true
    error.value = null
    try {
      const data = await leaveApi.createLeave(leaveData)
      leaves.value.unshift(data)
      return data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function approveLeave(id: string, reviewedBy: string, comments?: string) {
    loading.value = true
    error.value = null
    try {
      const data = await leaveApi.approveLeave(id, reviewedBy, comments)
      const index = leaves.value.findIndex((l) => l.id === id)
      if (index !== -1) {
        leaves.value[index] = data
      }
      return data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function rejectLeave(id: string, reviewedBy: string, comments?: string) {
    loading.value = true
    error.value = null
    try {
      const data = await leaveApi.rejectLeave(id, reviewedBy, comments)
      const index = leaves.value.findIndex((l) => l.id === id)
      if (index !== -1) {
        leaves.value[index] = data
      }
      return data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function cancelLeave(id: string) {
    loading.value = true
    error.value = null
    try {
      const data = await leaveApi.cancelLeave(id)
      const index = leaves.value.findIndex((l) => l.id === id)
      if (index !== -1) {
        leaves.value[index] = data
      }
      return data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchLeaveBalance(employeeId: string) {
    loading.value = true
    error.value = null
    try {
      const data = await leaveApi.getLeaveBalance(employeeId)
      leaveBalance.value = data
      return data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    leaves,
    currentLeave,
    leaveBalance,
    loading,
    error,
    allLeaves,
    pendingLeaves,
    approvedLeaves,
    fetchLeaves,
    fetchLeave,
    createLeave,
    approveLeave,
    rejectLeave,
    cancelLeave,
    fetchLeaveBalance,
  }
})
