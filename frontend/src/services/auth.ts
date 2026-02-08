import api from './api'

export interface LoginDto {
  email: string
  password: string
}

export interface RegisterDto {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: number
    email: string
    nameKhmer?: string
    nameLatin?: string
    roles: string[]
    studentId?: number | null
    groupId?: number | null
    teacherId?: number | null
  }
}

export interface CurrentUser {
  id: number
  email: string
  nameKhmer?: string
  nameLatin?: string
  firstName?: string
  lastName?: string
  roles: string[]
  studentId?: number | null
  groupId?: number | null
  teacherId?: number | null
  departmentId?: number | null
}

export const authService = {
  login(data: LoginDto): Promise<AuthResponse> {
    return api.post<AuthResponse>('/auth/login', data)
  },

  register(data: RegisterDto): Promise<AuthResponse> {
    return api.post<AuthResponse>('/auth/register', data)
  },

  getProfile(): Promise<CurrentUser> {
    return api.get<CurrentUser>('/auth/profile')
  },

  logout(): void {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  setToken(token: string): void {
    localStorage.setItem('token', token)
  },

  getToken(): string | null {
    return localStorage.getItem('token')
  },

  setUser(user: CurrentUser): void {
    localStorage.setItem('user', JSON.stringify(user))
  },

  getUser(): CurrentUser | null {
    const user = localStorage.getItem('user')
    if (!user || user === 'undefined' || user === 'null') {
      return null
    }
    try {
      return JSON.parse(user)
    } catch {
      return null
    }
  },

  isAuthenticated(): boolean {
    return !!this.getToken()
  },

  hasRole(role: string): boolean {
    const user = this.getUser()
    return user?.roles.includes(role) ?? false
  },

  isAdmin(): boolean {
    return this.hasRole('admin')
  },

  isTeacher(): boolean {
    return this.hasRole('teacher')
  },

  isStudent(): boolean {
    return this.hasRole('student')
  },
}
