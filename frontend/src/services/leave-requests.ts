import api from './api'

export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected'

export interface LeaveRequest {
  id: string
  studentId: number
  courseId: string
  sessionId?: string
  leaveDate: string
  reason: string
  status: LeaveRequestStatus
  reviewedById?: number
  reviewNote?: string
  reviewedAt?: string
  createdAt: string
  updatedAt: string
  student?: { id: number; firstName: string; lastName: string; email: string }
  course?: { id: string; name: string; code: string }
  session?: { id: string; title: string; startTime: string }
  reviewedBy?: { id: number; firstName: string; lastName: string }
}

export interface CreateLeaveRequestDto {
  courseId: string
  sessionId?: string
  leaveDate: string
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

  // Get my leave requests (student)
  getMyLeaveRequests(): Promise<LeaveRequest[]> {
    return api.get<LeaveRequest[]>('/leave-requests/my')
  },

  // Get leave requests for teacher's courses
  getTeacherLeaveRequests(): Promise<LeaveRequest[]> {
    return api.get<LeaveRequest[]>('/leave-requests/teacher')
  },

  // Get leave requests by course
  getByCourse(courseId: string): Promise<LeaveRequest[]> {
    return api.get<LeaveRequest[]>(`/leave-requests/course/${courseId}`)
  },

  // Get single leave request
  getOne(id: string): Promise<LeaveRequest> {
    return api.get<LeaveRequest>(`/leave-requests/${id}`)
  },

  // Create leave request (student)
  create(data: CreateLeaveRequestDto): Promise<LeaveRequest> {
    return api.post<LeaveRequest>('/leave-requests', data)
  },

  // Review leave request (teacher/admin)
  review(id: string, data: ReviewLeaveRequestDto): Promise<LeaveRequest> {
    return api.patch<LeaveRequest>(`/leave-requests/${id}/review`, data)
  },

  // Delete leave request
  delete(id: string): Promise<void> {
    return api.delete(`/leave-requests/${id}`)
  },
}
