import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

class LeaveApiService {
  private api

  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/leave`,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  async createLeave(leaveData: any) {
    const response = await this.api.post('/', leaveData)
    return response.data
  }

  async getAllLeaves(filters = {}) {
    const response = await this.api.get('/', { params: filters })
    return response.data
  }

  async getLeave(id: string) {
    const response = await this.api.get(`/${id}`)
    return response.data
  }

  async approveLeave(id: string, reviewedBy: string, comments?: string) {
    const response = await this.api.patch(`/${id}/approve`, {
      reviewedBy,
      comments,
    })
    return response.data
  }

  async rejectLeave(id: string, reviewedBy: string, comments?: string) {
    const response = await this.api.patch(`/${id}/reject`, {
      reviewedBy,
      comments,
    })
    return response.data
  }

  async cancelLeave(id: string) {
    const response = await this.api.patch(`/${id}/cancel`)
    return response.data
  }

  async getLeaveBalance(employeeId: string) {
    const response = await this.api.get(`/balance/${employeeId}`)
    return response.data
  }
}

export default new LeaveApiService()
