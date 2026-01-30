import api from './api'

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
    return api.get<Attendance[]>(`/attendances/session/${sessionId}`)
  },

  // Get session summary (for teacher/admin)
  getSessionSummary(sessionId: string): Promise<AttendanceSummary> {
    return api.get<AttendanceSummary>(`/attendances/session/${sessionId}/summary`)
  },

  // Get student's attendance (for teacher/admin)
  getByStudent(studentId: number): Promise<Attendance[]> {
    return api.get<Attendance[]>(`/attendances/student/${studentId}`)
  },

  // Mark single attendance (for teacher/admin)
  markAttendance(data: MarkAttendanceDto): Promise<Attendance> {
    return api.post<Attendance>('/attendances/mark', data)
  },

  // Bulk mark attendance (for teacher/admin)
  bulkMarkAttendance(data: BulkMarkAttendanceDto): Promise<Attendance[]> {
    return api.post<Attendance[]>('/attendances/bulk-mark', data)
  },

  // Update attendance record
  update(id: string, data: UpdateAttendanceDto): Promise<Attendance> {
    return api.patch<Attendance>(`/attendances/${id}`, data)
  },

  // Delete attendance record
  delete(id: string): Promise<void> {
    return api.delete(`/attendances/${id}`)
  },

  // Student check-in with code
  checkIn(code: string): Promise<Attendance> {
    return api.post<Attendance>('/attendances/check-in', { code })
  },

  // Get my attendance (for student)
  getMyAttendance(): Promise<Attendance[]> {
    return api.get<Attendance[]>('/attendances/my')
  },

  // Get my attendance for course (for student)
  getMyAttendanceByCourse(courseId: string): Promise<Attendance[]> {
    return api.get<Attendance[]>(`/attendances/my/course/${courseId}`)
  },
}
