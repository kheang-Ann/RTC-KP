import api from './api'

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export type ScheduleType = 'lecture' | 'practical' | 'lab'

export type Semester = 1 | 2

export type TimeSlot =
  | '07:00-08:00'
  | '08:00-09:00'
  | '09:00-10:00'
  | '10:00-11:00'
  | '13:00-14:00'
  | '14:00-15:00'
  | '15:00-16:00'
  | '16:00-17:00'

export const DAYS_OF_WEEK: { value: DayOfWeek; label: string }[] = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
]

export const TIME_SLOTS: { value: TimeSlot; label: string; period: 'morning' | 'afternoon' }[] = [
  { value: '07:00-08:00', label: '7:00 - 8:00', period: 'morning' },
  { value: '08:00-09:00', label: '8:00 - 9:00', period: 'morning' },
  { value: '09:00-10:00', label: '9:00 - 10:00', period: 'morning' },
  { value: '10:00-11:00', label: '10:00 - 11:00', period: 'morning' },
  { value: '13:00-14:00', label: '13:00 - 14:00', period: 'afternoon' },
  { value: '14:00-15:00', label: '14:00 - 15:00', period: 'afternoon' },
  { value: '15:00-16:00', label: '15:00 - 16:00', period: 'afternoon' },
  { value: '16:00-17:00', label: '16:00 - 17:00', period: 'afternoon' },
]

export const SCHEDULE_TYPES: { value: ScheduleType; label: string; color: string }[] = [
  { value: 'lecture', label: 'Lecture', color: '#4CAF50' },
  { value: 'practical', label: 'Practical', color: '#2196F3' },
  { value: 'lab', label: 'Lab', color: '#FF9800' },
]

export const SEMESTERS: { value: Semester; label: string }[] = [
  { value: 1, label: 'Semester 1' },
  { value: 2, label: 'Semester 2' },
]

export interface Schedule {
  id: number
  courseId: string
  groupId: number
  dayOfWeek: DayOfWeek
  startSlot: TimeSlot
  duration: number
  type: ScheduleType
  roomNumber: string
  color: string | null
  isActive: boolean
  semester: Semester
  semesterWeeks: number
  course?: {
    id: string
    name: string
    code: string
    teacher?: {
      id: number
      nameKhmer: string | null
      nameLatin: string | null
      email: string
    }
  }
  group?: {
    id: number
    name: string
    academicYear: number
    program?: {
      id: number
      name: string
    }
  }
  createdAt: string
  updatedAt: string
}

export interface CreateScheduleDto {
  courseId: string
  groupId: number
  dayOfWeek: DayOfWeek
  startSlot: TimeSlot
  duration: number
  type: ScheduleType
  roomNumber: string
  color?: string
  semester: Semester
  semesterWeeks?: number
}

export interface UpdateScheduleDto extends Partial<CreateScheduleDto> {
  isActive?: boolean
}

// Helper to get slot index for positioning
export function getSlotIndex(slot: TimeSlot): number {
  return TIME_SLOTS.findIndex((s) => s.value === slot)
}

// Helper to check if slots overlap
export function doSlotsOverlap(
  slot1: TimeSlot,
  duration1: number,
  slot2: TimeSlot,
  duration2: number,
): boolean {
  const start1 = getSlotIndex(slot1)
  const end1 = start1 + duration1 - 1
  const start2 = getSlotIndex(slot2)
  const end2 = start2 + duration2 - 1
  return start1 <= end2 && end1 >= start2
}

export const schedulesService = {
  getAll(semester?: Semester): Promise<Schedule[]> {
    const params = semester ? `?semester=${semester}` : ''
    return api.get<Schedule[]>(`/schedules${params}`)
  },

  getOne(id: number): Promise<Schedule> {
    return api.get<Schedule>(`/schedules/${id}`)
  },

  getByGroup(groupId: number, semester?: Semester): Promise<Schedule[]> {
    const params = semester ? `?semester=${semester}` : ''
    return api.get<Schedule[]>(`/schedules/by-group/${groupId}${params}`)
  },

  getByGroupFormatted(groupId: number, semester?: Semester): Promise<Record<DayOfWeek, Schedule[]>> {
    const params = semester ? `?semester=${semester}` : ''
    return api.get<Record<DayOfWeek, Schedule[]>>(`/schedules/by-group/${groupId}/formatted${params}`)
  },

  getByCourse(courseId: string): Promise<Schedule[]> {
    return api.get<Schedule[]>(`/schedules/by-course/${courseId}`)
  },

  getByTeacher(teacherId: number, semester?: Semester): Promise<Schedule[]> {
    const params = semester ? `?semester=${semester}` : ''
    return api.get<Schedule[]>(`/schedules/by-teacher/${teacherId}${params}`)
  },

  getMySchedule(semester?: Semester): Promise<Schedule[]> {
    const params = semester ? `?semester=${semester}` : ''
    return api.get<Schedule[]>(`/schedules/my${params}`)
  },

  getMyTeachingSchedule(semester?: Semester): Promise<Schedule[]> {
    const params = semester ? `?semester=${semester}` : ''
    return api.get<Schedule[]>(`/schedules/my-teaching${params}`)
  },

  getTimeSlots(): Promise<TimeSlot[]> {
    return api.get<TimeSlot[]>('/schedules/time-slots')
  },

  getDaysOfWeek(): Promise<DayOfWeek[]> {
    return api.get<DayOfWeek[]>('/schedules/days-of-week')
  },

  create(data: CreateScheduleDto): Promise<Schedule> {
    return api.post<Schedule>('/schedules', data)
  },

  update(id: number, data: UpdateScheduleDto): Promise<Schedule> {
    return api.patch<Schedule>(`/schedules/${id}`, data)
  },

  delete(id: number): Promise<void> {
    return api.delete(`/schedules/${id}`)
  },
}
