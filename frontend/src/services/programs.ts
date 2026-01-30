import api from './api'
import { trimValue, isRequired, isValidLength } from '@/utils/validation'

export interface Program {
  id: number
  name: string
  duration: number
  degreeType: 'Bachelor' | 'Master' | 'PhD'
  departmentId: number
  department?: { id: number; name: string }
  createdAt?: string
}

export interface CreateProgramDto {
  name: string
  duration: number
  degreeType: 'Bachelor' | 'Master' | 'PhD'
  departmentId: number
}

export interface UpdateProgramDto {
  name?: string
  duration?: number
  degreeType?: 'Bachelor' | 'Master' | 'PhD'
  departmentId?: number
}

// Validation helper
function validateProgramName(name: string): void {
  const trimmed = trimValue(name)
  const requiredError = isRequired(trimmed, 'Program name')
  if (requiredError) {
    throw new Error(requiredError)
  }
  const lengthError = isValidLength(trimmed, 'Program name', 1, 100)
  if (lengthError) {
    throw new Error(lengthError)
  }
}

export const programsService = {
  getAll(): Promise<Program[]> {
    return api.get<Program[]>('/programs')
  },

  getByDepartment(departmentId: number): Promise<Program[]> {
    return api.get<Program[]>(`/programs?departmentId=${departmentId}`)
  },

  getOne(id: number): Promise<Program> {
    return api.get<Program>(`/programs/${id}`)
  },

  create(data: CreateProgramDto): Promise<Program> {
    const trimmedName = trimValue(data.name)
    validateProgramName(trimmedName)
    return api.post<Program>('/programs', { ...data, name: trimmedName })
  },

  update(id: number, data: UpdateProgramDto): Promise<Program> {
    const updateData: UpdateProgramDto = { ...data }
    if (data.name) {
      const trimmedName = trimValue(data.name)
      validateProgramName(trimmedName)
      updateData.name = trimmedName
    }
    return api.patch<Program>(`/programs/${id}`, updateData)
  },

  delete(id: number): Promise<void> {
    return api.delete(`/programs/${id}`)
  },
}
