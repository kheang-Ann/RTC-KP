import api from './api'

export interface Department {
  id: number
  name: string
}

export interface CreateDepartmentDto {
  name: string
}

export type UpdateDepartmentDto = Partial<CreateDepartmentDto>

export const departmentsService = {
  getAll(): Promise<Department[]> {
    return api.get<Department[]>('/departments')
  },

  getOne(name: string): Promise<Department> {
    return api.get<Department>(`/departments/${name}`)
  },

  create(data: CreateDepartmentDto): Promise<Department> {
    return api.post<Department>('/departments', data)
  },

  delete(id: number): Promise<void> {
    return api.delete(`/departments/${id}`)
  },
}
