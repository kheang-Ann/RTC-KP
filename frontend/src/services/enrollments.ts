import api from './api'

export type EnrollmentStatus = 'active' | 'completed' | 'failed' | 'dropped'

export const ENROLLMENT_STATUS_OPTIONS: { value: EnrollmentStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'dropped', label: 'Dropped' },
]

export interface Enrollment {
  id: string
  studentId: number
  courseId: string
  enrolledAt: string
  createdAt: string
  status: EnrollmentStatus
  student?: { id: number; nameKhmer: string | null; nameLatin: string | null; email: string }
  course?: { id: string; name: string; code: string }
}

export interface CreateEnrollmentDto {
  studentId: number
  courseId: string
  status?: EnrollmentStatus
}

export interface UpdateEnrollmentDto {
  enrolledAt?: string
  status?: EnrollmentStatus
}

export const enrollmentsService = {
  getAll(): Promise<Enrollment[]> {
    return api.get<Enrollment[]>('/enrollments')
  },

  getOne(id: string): Promise<Enrollment> {
    return api.get<Enrollment>(`/enrollments/${id}`)
  },

  // Get my enrollments (for student)
  getMyEnrollments(): Promise<Enrollment[]> {
    return api.get<Enrollment[]>('/enrollments/my')
  },

  getByStudent(studentId: number): Promise<Enrollment[]> {
    return api.get<Enrollment[]>(`/enrollments/student/${studentId}`)
  },

  getByCourse(courseId: string): Promise<Enrollment[]> {
    return api.get<Enrollment[]>(`/enrollments/course/${courseId}`)
  },

  create(data: CreateEnrollmentDto): Promise<Enrollment> {
    return api.post<Enrollment>('/enrollments', data)
  },

  update(id: string, data: UpdateEnrollmentDto): Promise<Enrollment> {
    return api.patch<Enrollment>(`/enrollments/${id}`, data)
  },

  delete(id: string): Promise<void> {
    return api.delete(`/enrollments/${id}`)
  },
}
