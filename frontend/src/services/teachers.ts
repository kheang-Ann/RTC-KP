import api from './api'

export interface Teacher {
  id: number
  userId: number | null
  image: string | null
  nameKhmer: string
  nameLatin: string
  gender: 'male' | 'female'
  dob: string
  departmentId: number
  personalEmail: string
  phoneNumbers: string[]
  department?: { id: number; name: string }
  user?: { id: number; email: string }
  createdAt?: string
  updatedAt?: string
}

export interface CreateTeacherDto {
  nameKhmer: string
  nameLatin: string
  gender: 'male' | 'female'
  dob: string
  departmentId: number
  personalEmail: string
  phoneNumbers: string[]
  password?: string
}

export interface UpdateTeacherDto {
  nameKhmer?: string
  nameLatin?: string
  gender?: 'male' | 'female'
  dob?: string
  departmentId?: number
  email?: string
  personalEmail?: string
  phoneNumbers?: string[]
  password?: string
}

export const teachersService = {
  getAll(): Promise<Teacher[]> {
    return api.get<Teacher[]>('/teachers')
  },

  getOne(id: number): Promise<Teacher> {
    return api.get<Teacher>(`/teachers/${id}`)
  },

  create(data: CreateTeacherDto, image?: File): Promise<Teacher> {
    const formData = new FormData()
    formData.append('nameKhmer', data.nameKhmer)
    formData.append('nameLatin', data.nameLatin)
    formData.append('gender', data.gender)
    formData.append('dob', data.dob)
    formData.append('departmentId', data.departmentId.toString())
    formData.append('personalEmail', data.personalEmail)
    formData.append('phoneNumbers', JSON.stringify(data.phoneNumbers))
    if (data.password) {
      formData.append('password', data.password)
    }
    if (image) {
      formData.append('image', image)
    }
    return api.postFormData<Teacher>('/teachers', formData)
  },

  update(id: number, data: UpdateTeacherDto, image?: File): Promise<Teacher> {
    const formData = new FormData()
    if (data.nameKhmer) formData.append('nameKhmer', data.nameKhmer)
    if (data.nameLatin) formData.append('nameLatin', data.nameLatin)
    if (data.gender) formData.append('gender', data.gender)
    if (data.dob) formData.append('dob', data.dob)
    if (data.departmentId) formData.append('departmentId', data.departmentId.toString())
    if (data.email) formData.append('email', data.email)
    if (data.personalEmail) formData.append('personalEmail', data.personalEmail)
    if (data.phoneNumbers) formData.append('phoneNumbers', JSON.stringify(data.phoneNumbers))
    if (data.password) formData.append('password', data.password)
    if (image) formData.append('image', image)
    return api.patchFormData<Teacher>(`/teachers/${id}`, formData)
  },

  delete(id: number): Promise<void> {
    return api.delete(`/teachers/${id}`)
  },
}
