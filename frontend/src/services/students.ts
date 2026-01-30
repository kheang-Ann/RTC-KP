import api from './api'

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

export const studentsService = {
  getAll(): Promise<Student[]> {
    return api.get<Student[]>('/students')
  },

  getOne(id: number): Promise<Student> {
    return api.get<Student>(`/students/${id}`)
  },

  create(data: CreateStudentDto, image?: File): Promise<Student> {
    const formData = new FormData()
    formData.append('nameKhmer', data.nameKhmer)
    formData.append('nameLatin', data.nameLatin)
    formData.append('gender', data.gender)
    formData.append('dob', data.dob)
    formData.append('departmentId', data.departmentId.toString())
    formData.append('programId', data.programId.toString())
    formData.append('personalEmail', data.personalEmail)
    formData.append('phoneNumbers', JSON.stringify(data.phoneNumbers))
    formData.append('emergencyPhoneNumbers', JSON.stringify(data.emergencyPhoneNumbers))
    if (data.password) {
      formData.append('password', data.password)
    }
    if (image) {
      formData.append('image', image)
    }
    return api.postFormData<Student>('/students', formData)
  },

  update(id: number, data: UpdateStudentDto, image?: File): Promise<Student> {
    const formData = new FormData()
    if (data.nameKhmer) formData.append('nameKhmer', data.nameKhmer)
    if (data.nameLatin) formData.append('nameLatin', data.nameLatin)
    if (data.gender) formData.append('gender', data.gender)
    if (data.dob) formData.append('dob', data.dob)
    if (data.departmentId) formData.append('departmentId', data.departmentId.toString())
    if (data.programId) formData.append('programId', data.programId.toString())
    if (data.academicStatus) formData.append('academicStatus', data.academicStatus)
    if (data.academicYear) formData.append('academicYear', data.academicYear.toString())
    if (data.email) formData.append('email', data.email)
    if (data.personalEmail) formData.append('personalEmail', data.personalEmail)
    if (data.phoneNumbers) formData.append('phoneNumbers', JSON.stringify(data.phoneNumbers))
    if (data.emergencyPhoneNumbers)
      formData.append('emergencyPhoneNumbers', JSON.stringify(data.emergencyPhoneNumbers))
    if (data.password) formData.append('password', data.password)
    if (image) formData.append('image', image)
    return api.patchFormData<Student>(`/students/${id}`, formData)
  },

  delete(id: number): Promise<void> {
    return api.delete(`/students/${id}`)
  },
}
