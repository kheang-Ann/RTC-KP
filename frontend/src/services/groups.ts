import api from './api'

export interface Group {
  id: number
  name: string
  programId: number
  academicYear: number
  maxCapacity: number
  program?: {
    id: number
    name: string
    duration: number
    department?: { id: number; name: string }
  }
  students?: Array<{
    id: number
    nameKhmer: string
    nameLatin: string
    userId: number | null
  }>
  createdAt: string
  updatedAt: string
}

export interface CreateGroupDto {
  name: string
  programId: number
  academicYear: number
  maxCapacity?: number
}

export type UpdateGroupDto = Partial<CreateGroupDto>

export interface AvailableStudent {
  id: number
  nameKhmer: string
  nameLatin: string
  userId: number | null
  personalEmail: string
  gender?: string
  program?: { id: number; name: string }
}

export const groupsService = {
  getAll(): Promise<Group[]> {
    return api.get<Group[]>('/groups')
  },

  getOne(id: number): Promise<Group> {
    return api.get<Group>(`/groups/${id}`)
  },

  getByProgram(programId: number): Promise<Group[]> {
    return api.get<Group[]>(`/groups/by-program/${programId}`)
  },

  getByProgramAndYear(programId: number, academicYear: number): Promise<Group[]> {
    return api.get<Group[]>(`/groups/by-program/${programId}/year/${academicYear}`)
  },

  getStudentsInGroup(groupId: number): Promise<AvailableStudent[]> {
    return api.get<AvailableStudent[]>(`/groups/${groupId}/students`)
  },

  getAvailableStudents(programId: number, academicYear: number): Promise<AvailableStudent[]> {
    return api.get<AvailableStudent[]>(
      `/groups/available-students?programId=${programId}&academicYear=${academicYear}`,
    )
  },

  create(data: CreateGroupDto): Promise<Group> {
    return api.post<Group>('/groups', data)
  },

  update(id: number, data: UpdateGroupDto): Promise<Group> {
    return api.patch<Group>(`/groups/${id}`, data)
  },

  delete(id: number): Promise<void> {
    return api.delete(`/groups/${id}`)
  },

  addStudentsToGroup(groupId: number, studentIds: number[]): Promise<Group> {
    return api.post<Group>(`/groups/${groupId}/students`, { studentIds })
  },

  removeStudentFromGroup(groupId: number, studentId: number): Promise<Group> {
    return api.delete(`/groups/${groupId}/students/${studentId}`)
  },
}
