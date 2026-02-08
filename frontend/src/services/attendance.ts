import api from './api'
import {
  validateMarkAttendance,
  validateBulkMarkAttendance,
  validateUpdateAttendance,
  validateCheckIn,
  getErrorMessages,
  isValidUUID,
  isPositiveInteger,
} from '@/utils/validation'

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

export interface Attendance {
  id: string
  studentId: number
  sessionId: string
  status: AttendanceStatus
  checkInTime?: string
  markedById?: number
  remarks?: string
  createdAt?: string
  student?: { id: number; nameKhmer: string | null; nameLatin: string | null }
  session?: {
    id: string
    title: string
    startTime: string
    endTime: string
    courseId: string
    course?: { id: string; name: string; code: string }
  }
}

export interface MarkAttendanceDto {
  studentId: number
  sessionId: string
  status: AttendanceStatus
  remarks?: string
}

export interface BulkAttendanceItem {
  studentId: number
  status: AttendanceStatus
  remarks?: string
}

export interface BulkMarkAttendanceDto {
  sessionId: string
  attendances: BulkAttendanceItem[]
}

export interface UpdateAttendanceDto {
  status?: AttendanceStatus
  remarks?: string
}

export interface AttendanceSummary {
  total: number
  present: number
  absent: number
  late: number
  excused: number
}

export const attendanceService = {
  // Get attendance by session (for teacher/admin)
  getBySession(sessionId: string): Promise<Attendance[]> {
    const uuidError = isValidUUID(sessionId, 'Session ID')
    if (uuidError) {
      return Promise.reject(new Error(uuidError))
    }
    return api.get<Attendance[]>(`/attendances/session/${sessionId}`)
  },

  // Get session summary (for teacher/admin)
  getSessionSummary(sessionId: string): Promise<AttendanceSummary> {
    const uuidError = isValidUUID(sessionId, 'Session ID')
    if (uuidError) {
      return Promise.reject(new Error(uuidError))
    }
    return api.get<AttendanceSummary>(`/attendances/session/${sessionId}/summary`)
  },

  // Get student's attendance (for teacher/admin)
  getByStudent(studentId: number): Promise<Attendance[]> {
    const intError = isPositiveInteger(studentId, 'Student ID')
    if (intError) {
      return Promise.reject(new Error(intError))
    }
    return api.get<Attendance[]>(`/attendances/student/${studentId}`)
  },

  // Mark single attendance (for teacher/admin)
  markAttendance(data: MarkAttendanceDto): Promise<Attendance> {
    const validation = validateMarkAttendance(data)
    if (!validation.valid) {
      return Promise.reject(new Error(getErrorMessages(validation)))
    }
    return api.post<Attendance>('/attendances/mark', data)
  },

  // Bulk mark attendance (for teacher/admin)
  bulkMarkAttendance(data: BulkMarkAttendanceDto): Promise<Attendance[]> {
    const validation = validateBulkMarkAttendance(data)
    if (!validation.valid) {
      return Promise.reject(new Error(getErrorMessages(validation)))
    }
    return api.post<Attendance[]>('/attendances/bulk-mark', data)
  },

  // Update attendance record
  update(id: string, data: UpdateAttendanceDto): Promise<Attendance> {
    const uuidError = isValidUUID(id, 'Attendance ID')
    if (uuidError) {
      return Promise.reject(new Error(uuidError))
    }
    const validation = validateUpdateAttendance(data)
    if (!validation.valid) {
      return Promise.reject(new Error(getErrorMessages(validation)))
    }
    return api.patch<Attendance>(`/attendances/${id}`, data)
  },

  // Delete attendance record
  delete(id: string): Promise<void> {
    const uuidError = isValidUUID(id, 'Attendance ID')
    if (uuidError) {
      return Promise.reject(new Error(uuidError))
    }
    return api.delete(`/attendances/${id}`)
  },

  // Student check-in with code
  checkIn(code: string): Promise<Attendance> {
    const validation = validateCheckIn(code)
    if (!validation.valid) {
      return Promise.reject(new Error(getErrorMessages(validation)))
    }
    return api.post<Attendance>('/attendances/check-in', { code: code.trim().toUpperCase() })
  },

  // Get my attendance (for student)
  getMyAttendance(): Promise<Attendance[]> {
    return api.get<Attendance[]>('/attendances/my')
  },

  // Get my attendance for course (for student)
  getMyAttendanceByCourse(courseId: string): Promise<Attendance[]> {
    const uuidError = isValidUUID(courseId, 'Course ID')
    if (uuidError) {
      return Promise.reject(new Error(uuidError))
    }
    return api.get<Attendance[]>(`/attendances/my/course/${courseId}`)
  },
}
