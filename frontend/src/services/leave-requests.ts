import api from './api'

export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected'
export type LeaveType = 'sick' | 'annual' | 'emergency' | 'other'
export type RequesterType = 'student' | 'teacher'

export interface LeaveRequest {
  id: string
  userId: number
  requesterType: RequesterType
  studentId?: number
  teacherId?: number
  leaveType: LeaveType
  startDate: string
  endDate: string
  totalDays: number
  reason: string
  documentPath?: string
  status: LeaveRequestStatus
  reviewedById?: number
  reviewNote?: string
  reviewedAt?: string
  createdAt: string
  updatedAt: string
  user?: { id: number; nameKhmer: string; nameLatin: string; email: string }
  student?: { id: number; nameKhmer: string; nameLatin: string; personalEmail: string }
  teacher?: { id: number; nameKhmer: string; nameLatin: string; personalEmail: string }
  reviewedBy?: { id: number; nameKhmer: string; nameLatin: string }
}

export interface ContactDetails {
  name: string
  nameKhmer: string
  email: string
  phoneNumbers: string[]
  emergencyPhoneNumbers?: string[]
  department?: string
  program?: string
  type: string
}

export interface LeaveRequestWithDetails {
  leaveRequest: LeaveRequest
  contactDetails: ContactDetails
}

export interface CreateLeaveRequestDto {
  leaveType: LeaveType
  startDate: string
  endDate: string
  reason: string
}

export interface ReviewLeaveRequestDto {
  status: LeaveRequestStatus
  reviewNote?: string
}

export const leaveRequestsService = {
  // Get all leave requests (admin)
  getAll(): Promise<LeaveRequest[]> {
    return api.get<LeaveRequest[]>('/leave-requests')
  },

  // Get my leave requests (student or teacher)
  getMyLeaveRequests(): Promise<LeaveRequest[]> {
    return api.get<LeaveRequest[]>('/leave-requests/my')
  },

  // Get single leave request
  getOne(id: string): Promise<LeaveRequest> {
    return api.get<LeaveRequest>(`/leave-requests/${id}`)
  },

  // Get single leave request with details (admin)
  getOneWithDetails(id: string): Promise<LeaveRequestWithDetails> {
    return api.get<LeaveRequestWithDetails>(`/leave-requests/${id}/details`)
  },

  // Create leave request (student)
  createStudentRequest(data: CreateLeaveRequestDto, document?: File): Promise<LeaveRequest> {
    if (document) {
      const formData = new FormData()
      formData.append('leaveType', data.leaveType)
      formData.append('startDate', data.startDate)
      formData.append('endDate', data.endDate)
      formData.append('reason', data.reason)
      formData.append('document', document)
      return api.postFormData<LeaveRequest>('/leave-requests/student', formData)
    }
    return api.post<LeaveRequest>('/leave-requests/student', data)
  },

  // Create leave request (teacher)
  createTeacherRequest(data: CreateLeaveRequestDto, document?: File): Promise<LeaveRequest> {
    if (document) {
      const formData = new FormData()
      formData.append('leaveType', data.leaveType)
      formData.append('startDate', data.startDate)
      formData.append('endDate', data.endDate)
      formData.append('reason', data.reason)
      formData.append('document', document)
      return api.postFormData<LeaveRequest>('/leave-requests/teacher', formData)
    }
    return api.post<LeaveRequest>('/leave-requests/teacher', data)
  },

  // Review leave request (admin)
  review(id: string, data: ReviewLeaveRequestDto): Promise<LeaveRequest> {
    return api.patch<LeaveRequest>(`/leave-requests/${id}/review`, data)
  },

  // Delete leave request
  delete(id: string): Promise<void> {
    return api.delete(`/leave-requests/${id}`)
  },
}
