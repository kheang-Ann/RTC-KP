import api from './api'
import {
  isValidPhoneNumbers,
  isValidOptionalPassword,
  trimValue,
  normalizePhoneArray,
} from '@/utils/validation'

export interface Student {
  id: number
  userId: number | null
  image: string | null
  nameKhmer: string
  nameLatin: string
  gender: 'male' | 'female'
  dob: string
  departmentId: number
  programId: number
  academicStatus: 'active' | 'suspended' | 'leave' | 'graduation'
  academicYear: number
  personalEmail: string
  phoneNumbers: string[]
  emergencyPhoneNumbers: string[]
  department?: { id: number; name: string }
  program?: { id: number; name: string; duration: number }
  user?: { id: number; email: string }
  createdAt?: string
  updatedAt?: string
}

export interface CreateStudentDto {
  nameKhmer: string
  nameLatin: string
  gender: 'male' | 'female'
  dob: string
  departmentId: number
  programId: number
  personalEmail: string
  phoneNumbers: string[]
  emergencyPhoneNumbers: string[]
  password?: string
}

export interface UpdateStudentDto {
  nameKhmer?: string
  nameLatin?: string
  gender?: 'male' | 'female'
  dob?: string
  departmentId?: number
  programId?: number
  academicStatus?: 'active' | 'suspended' | 'leave' | 'graduation'
  academicYear?: number
  email?: string
  personalEmail?: string
  phoneNumbers?: string[]
  emergencyPhoneNumbers?: string[]
  password?: string
}

// Validation helper for create
function validateCreateStudent(data: CreateStudentDto): void {
  const phoneError = isValidPhoneNumbers(data.phoneNumbers, 'Phone number')
  if (phoneError) {
    throw new Error(phoneError)
  }
  const emergencyPhoneError = isValidPhoneNumbers(data.emergencyPhoneNumbers, 'Emergency phone number')
  if (emergencyPhoneError) {
    throw new Error(emergencyPhoneError)
  }
  if (data.password) {
    const passwordError = isValidOptionalPassword(data.password)
    if (passwordError) {
      throw new Error(passwordError)
    }
  }
}

// Validation helper for update
function validateUpdateStudent(data: UpdateStudentDto): void {
  if (data.phoneNumbers) {
    const phoneError = isValidPhoneNumbers(data.phoneNumbers, 'Phone number')
    if (phoneError) {
      throw new Error(phoneError)
    }
  }
  if (data.emergencyPhoneNumbers) {
    const emergencyPhoneError = isValidPhoneNumbers(data.emergencyPhoneNumbers, 'Emergency phone number')
    if (emergencyPhoneError) {
      throw new Error(emergencyPhoneError)
    }
  }
  if (data.password) {
    const passwordError = isValidOptionalPassword(data.password)
    if (passwordError) {
      throw new Error(passwordError)
    }
  }
}

export const studentsService = {
  getAll(): Promise<Student[]> {
    return api.get<Student[]>('/students')
  },

  getMyProfile(): Promise<Student> {
    return api.get<Student>('/students/me')
  },

  getOne(id: number): Promise<Student> {
    return api.get<Student>(`/students/${id}`)
  },

  create(data: CreateStudentDto, image?: File): Promise<Student> {
    // Trim values and normalize phone numbers
    const trimmedData = {
      ...data,
      nameKhmer: trimValue(data.nameKhmer),
      nameLatin: trimValue(data.nameLatin),
      personalEmail: trimValue(data.personalEmail),
      phoneNumbers: normalizePhoneArray(data.phoneNumbers),
      emergencyPhoneNumbers: normalizePhoneArray(data.emergencyPhoneNumbers),
      password: data.password ? trimValue(data.password) : undefined,
    }

    // Validate
    validateCreateStudent(trimmedData)

    const formData = new FormData()
    formData.append('nameKhmer', trimmedData.nameKhmer)
    formData.append('nameLatin', trimmedData.nameLatin)
    formData.append('gender', data.gender)
    formData.append('dob', data.dob)
    formData.append('departmentId', data.departmentId.toString())
    formData.append('programId', data.programId.toString())
    formData.append('personalEmail', trimmedData.personalEmail)
    formData.append('phoneNumbers', JSON.stringify(trimmedData.phoneNumbers))
    formData.append('emergencyPhoneNumbers', JSON.stringify(trimmedData.emergencyPhoneNumbers))
    if (trimmedData.password) {
      formData.append('password', trimmedData.password)
    }
    if (image) {
      formData.append('image', image)
    }
    return api.postFormData<Student>('/students', formData)
  },

  update(id: number, data: UpdateStudentDto, image?: File): Promise<Student> {
    // Trim values and normalize phone numbers
    const trimmedData: UpdateStudentDto = {
      ...data,
      nameKhmer: data.nameKhmer ? trimValue(data.nameKhmer) : undefined,
      nameLatin: data.nameLatin ? trimValue(data.nameLatin) : undefined,
      personalEmail: data.personalEmail ? trimValue(data.personalEmail) : undefined,
      email: data.email ? trimValue(data.email) : undefined,
      phoneNumbers: data.phoneNumbers ? normalizePhoneArray(data.phoneNumbers) : undefined,
      emergencyPhoneNumbers: data.emergencyPhoneNumbers ? normalizePhoneArray(data.emergencyPhoneNumbers) : undefined,
      password: data.password ? trimValue(data.password) : undefined,
    }

    // Validate
    validateUpdateStudent(trimmedData)

    const formData = new FormData()
    if (trimmedData.nameKhmer) formData.append('nameKhmer', trimmedData.nameKhmer)
    if (trimmedData.nameLatin) formData.append('nameLatin', trimmedData.nameLatin)
    if (data.gender) formData.append('gender', data.gender)
    if (data.dob) formData.append('dob', data.dob)
    if (data.departmentId !== undefined) formData.append('departmentId', data.departmentId.toString())
    if (data.programId !== undefined) formData.append('programId', data.programId.toString())
    if (data.academicStatus) formData.append('academicStatus', data.academicStatus)
    if (data.academicYear !== undefined) formData.append('academicYear', data.academicYear.toString())
    if (trimmedData.email) formData.append('email', trimmedData.email)
    if (trimmedData.personalEmail) formData.append('personalEmail', trimmedData.personalEmail)
    if (trimmedData.phoneNumbers) formData.append('phoneNumbers', JSON.stringify(trimmedData.phoneNumbers))
    if (trimmedData.emergencyPhoneNumbers)
      formData.append('emergencyPhoneNumbers', JSON.stringify(trimmedData.emergencyPhoneNumbers))
    if (trimmedData.password) formData.append('password', trimmedData.password)
    if (image) formData.append('image', image)
    return api.patchFormData<Student>(`/students/${id}`, formData)
  },

  delete(id: number): Promise<void> {
    return api.delete(`/students/${id}`)
  },
}
