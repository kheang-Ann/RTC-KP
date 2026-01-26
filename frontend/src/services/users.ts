import api from './api'

export interface UserRole {
  id: number
  role: { id: number; name: string }
}

export interface User {
  id: number
  firstName: string
  lastName: string
  email: string
  isActive: boolean
  departmentId?: number
  roles: UserRole[] | string[]
  department?: { id: number; name: string }
  createdAt?: string
}

// Helper to check if user has a specific role
export function hasRole(user: User, roleName: string): boolean {
  if (!user.roles || user.roles.length === 0) return false
  // Check if roles is array of strings or UserRole objects
  if (typeof user.roles[0] === 'string') {
    return (user.roles as string[]).includes(roleName)
  }
  return (user.roles as UserRole[]).some((r) => r.role?.name === roleName)
}

export interface CreateUserDto {
  firstName: string
  lastName: string
  email: string
  password: string
  roleId: number
  departmentId?: number
}

export interface UpdateUserDto {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  isActive?: boolean
  departmentId?: number
}

export const usersService = {
  getAll(): Promise<User[]> {
    return api.get<User[]>('/users')
  },

  getOne(id: number): Promise<User> {
    return api.get<User>(`/users/${id}`)
  },

  create(data: CreateUserDto): Promise<User> {
    return api.post<User>('/users', data)
  },

  update(id: number, data: UpdateUserDto): Promise<User> {
    return api.patch<User>(`/users/${id}`, data)
  },

  delete(id: number): Promise<void> {
    return api.delete(`/users/${id}`)
  },

  // Filter users by role (for teacher to manage students)
  getStudents(): Promise<User[]> {
    return api.get<User[]>('/users').then((users) => users.filter((u) => hasRole(u, 'student')))
  },

  getTeachers(): Promise<User[]> {
    return api.get<User[]>('/users').then((users) => users.filter((u) => hasRole(u, 'teacher')))
  },
}
