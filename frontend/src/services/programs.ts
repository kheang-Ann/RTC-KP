import api from './api'

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
    return api.post<Program>('/programs', data)
  },

  update(id: number, data: UpdateProgramDto): Promise<Program> {
    return api.patch<Program>(`/programs/${id}`, data)
  },

  delete(id: number): Promise<void> {
    return api.delete(`/programs/${id}`)
  },
}
