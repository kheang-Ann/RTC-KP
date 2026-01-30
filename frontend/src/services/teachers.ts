import api from './api'
import {
  isValidPhoneNumbers,
  isValidOptionalPassword,
  trimValue,
  normalizePhoneArray,
} from '@/utils/validation'

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

// Validation helper for create
function validateCreateTeacher(data: CreateTeacherDto): void {
  const phoneError = isValidPhoneNumbers(data.phoneNumbers, 'Phone number')
  if (phoneError) {
    throw new Error(phoneError)
  }
  if (data.password) {
    const passwordError = isValidOptionalPassword(data.password)
    if (passwordError) {
      throw new Error(passwordError)
    }
  }
}

// Validation helper for update
function validateUpdateTeacher(data: UpdateTeacherDto): void {
  if (data.phoneNumbers) {
    const phoneError = isValidPhoneNumbers(data.phoneNumbers, 'Phone number')
    if (phoneError) {
      throw new Error(phoneError)
    }
  }
  if (data.password) {
    const passwordError = isValidOptionalPassword(data.password)
    if (passwordError) {
      throw new Error(passwordError)
    }
  }
}

export const teachersService = {
  getAll(): Promise<Teacher[]> {
    return api.get<Teacher[]>('/teachers')
  },

  getMyProfile(): Promise<Teacher> {
    return api.get<Teacher>('/teachers/me')
  },

  getOne(id: number): Promise<Teacher> {
    return api.get<Teacher>(`/teachers/${id}`)
  },

  create(data: CreateTeacherDto, image?: File): Promise<Teacher> {
    // Trim values and normalize phone numbers
    const trimmedData = {
      ...data,
      nameKhmer: trimValue(data.nameKhmer),
      nameLatin: trimValue(data.nameLatin),
      personalEmail: trimValue(data.personalEmail),
      phoneNumbers: normalizePhoneArray(data.phoneNumbers),
      password: data.password ? trimValue(data.password) : undefined,
    }

    // Validate
    validateCreateTeacher(trimmedData)

    const formData = new FormData()
    formData.append('nameKhmer', trimmedData.nameKhmer)
    formData.append('nameLatin', trimmedData.nameLatin)
    formData.append('gender', data.gender)
    formData.append('dob', data.dob)
    formData.append('departmentId', data.departmentId.toString())
    formData.append('personalEmail', trimmedData.personalEmail)
    formData.append('phoneNumbers', JSON.stringify(trimmedData.phoneNumbers))
    if (trimmedData.password) {
      formData.append('password', trimmedData.password)
    }
    if (image) {
      formData.append('image', image)
    }
    return api.postFormData<Teacher>('/teachers', formData)
  },

  update(id: number, data: UpdateTeacherDto, image?: File): Promise<Teacher> {
    // Trim values and normalize phone numbers
    const trimmedData: UpdateTeacherDto = {
      ...data,
      nameKhmer: data.nameKhmer ? trimValue(data.nameKhmer) : undefined,
      nameLatin: data.nameLatin ? trimValue(data.nameLatin) : undefined,
      personalEmail: data.personalEmail ? trimValue(data.personalEmail) : undefined,
      email: data.email ? trimValue(data.email) : undefined,
      phoneNumbers: data.phoneNumbers ? normalizePhoneArray(data.phoneNumbers) : undefined,
      password: data.password ? trimValue(data.password) : undefined,
    }

    // Validate
    validateUpdateTeacher(trimmedData)

    const formData = new FormData()
    if (trimmedData.nameKhmer) formData.append('nameKhmer', trimmedData.nameKhmer)
    if (trimmedData.nameLatin) formData.append('nameLatin', trimmedData.nameLatin)
    if (data.gender) formData.append('gender', data.gender)
    if (data.dob) formData.append('dob', data.dob)
    if (data.departmentId) formData.append('departmentId', data.departmentId.toString())
    if (trimmedData.email) formData.append('email', trimmedData.email)
    if (trimmedData.personalEmail) formData.append('personalEmail', trimmedData.personalEmail)
    if (trimmedData.phoneNumbers) formData.append('phoneNumbers', JSON.stringify(trimmedData.phoneNumbers))
    if (trimmedData.password) formData.append('password', trimmedData.password)
    if (image) formData.append('image', image)
    return api.patchFormData<Teacher>(`/teachers/${id}`, formData)
  },

  delete(id: number): Promise<void> {
    return api.delete(`/teachers/${id}`)
  },
}
