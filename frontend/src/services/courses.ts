import api from './api'

export interface Course {
  id: string
  name: string
  code: string
  credits: number
  departmentId: number | null
  teacherId: number | null
  department?: { id: number; name: string }
  teacher?: { id: number; nameKhmer: string | null; nameLatin: string | null; email: string }
  createdAt: string
}

export interface CreateCourseDto {
  name: string
  code: string
  credits?: number
  departmentId?: number
  teacherId?: number
}

export type UpdateCourseDto = Partial<CreateCourseDto>

export const coursesService = {
  getAll(): Promise<Course[]> {
    return api.get<Course[]>('/courses')
  },

  // Get courses assigned to the logged-in teacher
  getMyCourses(): Promise<Course[]> {
    return api.get<Course[]>('/courses/my')
  },

  getOne(id: string): Promise<Course> {
    return api.get<Course>(`/courses/${id}`)
  },

  create(data: CreateCourseDto): Promise<Course> {
    return api.post<Course>('/courses', data)
  },

  update(id: string, data: UpdateCourseDto): Promise<Course> {
    return api.patch<Course>(`/courses/${id}`, data)
  },

  delete(id: string): Promise<void> {
    return api.delete(`/courses/${id}`)
  },
}
