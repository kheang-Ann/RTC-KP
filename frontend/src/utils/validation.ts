// Validation utility functions for frontend form validation

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

// Trim and normalize spaces (multiple spaces to single space)
export function trimValue(value: string | undefined | null): string {
  return value?.trim().replace(/\s+/g, ' ') ?? ''
}

// Remove all spaces from phone number
export function normalizePhone(value: string): string {
  return value.replace(/\s/g, '').trim()
}

// Trim array of strings (normalize spaces)
export function trimArray(values: string[]): string[] {
  return values.map((v) => v.trim().replace(/\s+/g, ' ')).filter((v) => v !== '')
}

// Normalize phone array (remove all spaces)
export function normalizePhoneArray(values: string[]): string[] {
  return values.map((v) => v.replace(/\s/g, '').trim()).filter((v) => v !== '')
}

// Validate required field
export function isRequired(value: unknown, fieldName: string): string | null {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} is required`
  }
  return null
}

// Validate phone number (must start with 0, 9-11 digits)
export function isValidPhoneNumber(phone: string): string | null {
  // Remove spaces before validation
  const normalized = phone.replace(/\s/g, '').trim()
  if (!normalized) {
    return 'Phone number is required'
  }
  if (!/^0\d{8,10}$/.test(normalized)) {
    return 'Phone number must start with 0 and have 9-11 digits'
  }
  return null
}

// Validate array of phone numbers
export function isValidPhoneNumbers(phones: string[], fieldName: string = 'Phone numbers'): string | null {
  if (!phones || phones.length === 0) {
    return `At least one ${fieldName.toLowerCase()} is required`
  }
  for (let i = 0; i < phones.length; i++) {
    const phone = phones[i]
    if (phone !== undefined) {
      const error = isValidPhoneNumber(phone)
      if (error) {
        return `${fieldName} #${i + 1}: ${error}`
      }
    }
  }
  return null
}

// Validate password (min 8 characters)
export function isValidPassword(password: string): string | null {
  const trimmed = password.trim()
  if (!trimmed) {
    return 'Password is required'
  }
  if (trimmed.length < 8) {
    return 'Password must be at least 8 characters'
  }
  return null
}

// Validate optional password (only validate if provided)
export function isValidOptionalPassword(password: string | undefined): string | null {
  if (!password || password.trim() === '') {
    return null // Optional, so no error if empty
  }
  return isValidPassword(password)
}

// Validate string length
export function isValidLength(
  value: string,
  fieldName: string,
  min: number,
  max: number
): string | null {
  if (value.length < min) {
    return `${fieldName} must be at least ${min} characters`
  }
  if (value.length > max) {
    return `${fieldName} cannot exceed ${max} characters`
  }
  return null
}

// Validate positive integer
export function isPositiveInteger(value: number, fieldName: string): string | null {
  if (!Number.isInteger(value) || value <= 0) {
    return `${fieldName} must be a positive number`
  }
  return null
}

// Validate UUID format
export function isValidUUID(value: string, fieldName: string): string | null {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(value)) {
    return `${fieldName} must be a valid ID`
  }
  return null
}

// Validate attendance status
export function isValidAttendanceStatus(value: string): string | null {
  const validStatuses = ['present', 'absent', 'late', 'excused']
  if (!validStatuses.includes(value)) {
    return 'Status must be one of: present, absent, late, excused'
  }
  return null
}

// Validate attendance code
export function isValidAttendanceCode(code: string): string | null {
  if (!code || code.trim() === '') {
    return 'Attendance code is required'
  }
  const trimmed = code.trim()
  if (trimmed.length < 4 || trimmed.length > 8) {
    return 'Attendance code must be between 4 and 8 characters'
  }
  if (!/^[A-Za-z0-9]+$/.test(trimmed)) {
    return 'Attendance code can only contain letters and numbers'
  }
  return null
}

// Validate remarks
export function isValidRemarks(remarks: string | undefined): string | null {
  if (remarks && remarks.length > 500) {
    return 'Remarks cannot exceed 500 characters'
  }
  return null
}

// Validate array is not empty
export function isArrayNotEmpty<T>(arr: T[], fieldName: string): string | null {
  if (!Array.isArray(arr) || arr.length === 0) {
    return `At least one ${fieldName} is required`
  }
  return null
}

// Validate array max size
export function isArrayMaxSize<T>(arr: T[], maxSize: number, fieldName: string): string | null {
  if (arr.length > maxSize) {
    return `Cannot process more than ${maxSize} ${fieldName} at once`
  }
  return null
}

// Attendance-specific validation functions
export interface MarkAttendanceData {
  sessionId: string
  studentId: number
  status: string
  remarks?: string
}

export function validateMarkAttendance(data: MarkAttendanceData): ValidationResult {
  const errors: ValidationError[] = []

  const sessionError = isRequired(data.sessionId, 'Session')
  if (sessionError) {
    errors.push({ field: 'sessionId', message: sessionError })
  } else {
    const uuidError = isValidUUID(data.sessionId, 'Session ID')
    if (uuidError) {
      errors.push({ field: 'sessionId', message: uuidError })
    }
  }

  const studentError = isRequired(data.studentId, 'Student')
  if (studentError) {
    errors.push({ field: 'studentId', message: studentError })
  } else {
    const intError = isPositiveInteger(data.studentId, 'Student ID')
    if (intError) {
      errors.push({ field: 'studentId', message: intError })
    }
  }

  const statusError = isRequired(data.status, 'Status')
  if (statusError) {
    errors.push({ field: 'status', message: statusError })
  } else {
    const enumError = isValidAttendanceStatus(data.status)
    if (enumError) {
      errors.push({ field: 'status', message: enumError })
    }
  }

  if (data.remarks) {
    const remarksError = isValidRemarks(data.remarks)
    if (remarksError) {
      errors.push({ field: 'remarks', message: remarksError })
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export interface BulkAttendanceItem {
  studentId: number
  status: string
  remarks?: string
}

export interface BulkMarkAttendanceData {
  sessionId: string
  attendances: BulkAttendanceItem[]
}

export function validateBulkMarkAttendance(data: BulkMarkAttendanceData): ValidationResult {
  const errors: ValidationError[] = []

  const sessionError = isRequired(data.sessionId, 'Session')
  if (sessionError) {
    errors.push({ field: 'sessionId', message: sessionError })
  } else {
    const uuidError = isValidUUID(data.sessionId, 'Session ID')
    if (uuidError) {
      errors.push({ field: 'sessionId', message: uuidError })
    }
  }

  const arrayEmptyError = isArrayNotEmpty(data.attendances, 'attendance record')
  if (arrayEmptyError) {
    errors.push({ field: 'attendances', message: arrayEmptyError })
  }

  const arraySizeError = isArrayMaxSize(data.attendances, 200, 'attendance records')
  if (arraySizeError) {
    errors.push({ field: 'attendances', message: arraySizeError })
  }

  // Validate each attendance item
  data.attendances.forEach((item, index) => {
    const studentError = isPositiveInteger(item.studentId, `Student ID at position ${index + 1}`)
    if (studentError) {
      errors.push({ field: `attendances[${index}].studentId`, message: studentError })
    }

    const statusError = isValidAttendanceStatus(item.status)
    if (statusError) {
      errors.push({ field: `attendances[${index}].status`, message: statusError })
    }

    if (item.remarks) {
      const remarksError = isValidRemarks(item.remarks)
      if (remarksError) {
        errors.push({ field: `attendances[${index}].remarks`, message: remarksError })
      }
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}

export interface UpdateAttendanceData {
  status?: string
  remarks?: string
}

export function validateUpdateAttendance(data: UpdateAttendanceData): ValidationResult {
  const errors: ValidationError[] = []

  // At least one field should be provided
  if (!data.status && data.remarks === undefined) {
    errors.push({ field: 'general', message: 'At least one field (status or remarks) must be provided' })
  }

  if (data.status) {
    const statusError = isValidAttendanceStatus(data.status)
    if (statusError) {
      errors.push({ field: 'status', message: statusError })
    }
  }

  if (data.remarks !== undefined && data.remarks !== null) {
    const remarksError = isValidRemarks(data.remarks)
    if (remarksError) {
      errors.push({ field: 'remarks', message: remarksError })
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function validateCheckIn(code: string): ValidationResult {
  const errors: ValidationError[] = []

  const codeError = isValidAttendanceCode(code)
  if (codeError) {
    errors.push({ field: 'code', message: codeError })
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// Helper to get first error message for a field
export function getFieldError(errors: ValidationError[], field: string): string | undefined {
  return errors.find((e) => e.field === field)?.message
}

// Helper to get all error messages as a single string
export function getErrorMessages(result: ValidationResult): string {
  return result.errors.map((e) => e.message).join('. ')
}
