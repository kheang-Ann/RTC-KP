import api from './api'

export type SessionStatus = 'scheduled' | 'active' | 'completed' | 'cancelled'

export interface Session {
  id: string
  title: string
  description?: string
  courseId: string
  createdById: number
  startTime: string
  endTime: string
  attendanceCode: string
  status: SessionStatus
  isCodeActive: boolean
  course?: { id: string; name: string; code: string }
  createdBy?: { id: number; firstName: string; lastName: string }
  createdAt: string
  updatedAt: string
}

export interface CreateSessionDto {
  title: string
  description?: string
  courseId: string
  startTime: string
  endTime: string
}

export type UpdateSessionDto = Partial<CreateSessionDto> & {
  status?: SessionStatus
  isCodeActive?: boolean
}

export const sessionsService = {
  getAll(): Promise<Session[]> {
    return api.get<Session[]>('/sessions')
  },

  getOne(id: string): Promise<Session> {
    return api.get<Session>(`/sessions/${id}`)
  },

  getByCourse(courseId: string): Promise<Session[]> {
    return api.get<Session[]>(`/sessions/course/${courseId}`)
  },

  getUpcoming(): Promise<Session[]> {
    return api.get<Session[]>('/sessions/upcoming')
  },

  create(data: CreateSessionDto): Promise<Session> {
    return api.post<Session>('/sessions', data)
  },

  update(id: string, data: UpdateSessionDto): Promise<Session> {
    return api.patch<Session>(`/sessions/${id}`, data)
  },

  activate(id: string): Promise<Session> {
    return api.post<Session>(`/sessions/${id}/activate`, {})
  },

  complete(id: string): Promise<Session> {
    return api.post<Session>(`/sessions/${id}/complete`, {})
  },

  regenerateCode(id: string): Promise<Session> {
    return api.post<Session>(`/sessions/${id}/regenerate-code`, {})
  },

  delete(id: string): Promise<void> {
    return api.delete(`/sessions/${id}`)
  },
}
