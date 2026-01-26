import api from './api'

export interface Enrollment {
  id: string
  studentId: number
  courseId: string
  enrolledAt: string
  status: 'active' | 'completed' | 'dropped'
  student?: { id: number; firstName: string; lastName: string; email: string }
  course?: { id: string; name: string; code: string }
}

export interface CreateEnrollmentDto {
  studentId: number
  courseId: string
}

export interface UpdateEnrollmentDto {
  status?: 'active' | 'completed' | 'dropped'
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
