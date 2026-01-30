import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsNotEmpty,
  MaxLength,
  Min,
} from 'class-validator';
import { AttendanceStatus } from '../entities/attendance.entity';

export class BulkAttendanceItemDto {
  @IsNotEmpty({ message: 'Student ID is required' })
  @IsInt({ message: 'Student ID must be an integer' })
  @Min(1, { message: 'Student ID must be a positive number' })
  studentId: number;

  @IsNotEmpty({ message: 'Status is required' })
  @IsEnum(AttendanceStatus, {
    message: 'Status must be one of: present, absent, late, excused',
  })
  status: AttendanceStatus;

  @IsOptional()
  @IsString({ message: 'Remarks must be a string' })
  @MaxLength(500, { message: 'Remarks cannot exceed 500 characters' })
  remarks?: string;
}
