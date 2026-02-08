import api from './api'
import { trimValue, isRequired, isValidLength } from '@/utils/validation'

export interface Department {
  id: number
  name: string
}

export interface CreateDepartmentDto {
  name: string
}

export type UpdateDepartmentDto = Partial<CreateDepartmentDto>

// Validation helper
function validateDepartment(name: string): void {
  const trimmed = trimValue(name)
  const requiredError = isRequired(trimmed, 'Department name')
  if (requiredError) {
    throw new Error(requiredError)
  }
  const lengthError = isValidLength(trimmed, 'Department name', 1, 100)
  if (lengthError) {
    throw new Error(lengthError)
  }
}

export const departmentsService = {
  getAll(): Promise<Department[]> {
    return api.get<Department[]>('/departments')
  },

  getOne(name: string): Promise<Department> {
    return api.get<Department>(`/departments/${name}`)
  },

  create(data: CreateDepartmentDto): Promise<Department> {
    const trimmedName = trimValue(data.name)
    validateDepartment(trimmedName)
    return api.post<Department>('/departments', { name: trimmedName })
  },

  update(id: number, data: UpdateDepartmentDto): Promise<Department> {
    const updateData: UpdateDepartmentDto = {}
    if (data.name) {
      const trimmedName = trimValue(data.name)
      validateDepartment(trimmedName)
      updateData.name = trimmedName
    }
    return api.patch<Department>(`/departments/${id}`, updateData)
  },

  delete(id: number): Promise<void> {
    return api.delete(`/departments/${id}`)
  },
}
