import api from './api'
import { trimValue, isRequired, isValidLength } from '@/utils/validation'

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

// Validation helper for course name
function validateCourseName(name: string): void {
  const trimmed = trimValue(name)
  const requiredError = isRequired(trimmed, 'Course name')
  if (requiredError) {
    throw new Error(requiredError)
  }
  const lengthError = isValidLength(trimmed, 'Course name', 1, 100)
  if (lengthError) {
    throw new Error(lengthError)
  }
}

// Validation helper for course code
function validateCourseCode(code: string): void {
  const trimmed = trimValue(code)
  const requiredError = isRequired(trimmed, 'Course code')
  if (requiredError) {
    throw new Error(requiredError)
  }
  const lengthError = isValidLength(trimmed, 'Course code', 1, 20)
  if (lengthError) {
    throw new Error(lengthError)
  }
}

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
    const trimmedName = trimValue(data.name)
    const trimmedCode = trimValue(data.code).toUpperCase()
    validateCourseName(trimmedName)
    validateCourseCode(trimmedCode)
    return api.post<Course>('/courses', { ...data, name: trimmedName, code: trimmedCode })
  },

  update(id: string, data: UpdateCourseDto): Promise<Course> {
    const updateData: UpdateCourseDto = { ...data }
    if (data.name) {
      const trimmedName = trimValue(data.name)
      validateCourseName(trimmedName)
      updateData.name = trimmedName
    }
    if (data.code) {
      const trimmedCode = trimValue(data.code).toUpperCase()
      validateCourseCode(trimmedCode)
      updateData.code = trimmedCode
    }
    return api.patch<Course>(`/courses/${id}`, updateData)
  },

  delete(id: string): Promise<void> {
    return api.delete(`/courses/${id}`)
  },
}
