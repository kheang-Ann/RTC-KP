import { IsOptional, IsEnum, IsString, MaxLength } from 'class-validator';
import { AttendanceStatus } from '../entities/attendance.entity';

export class UpdateAttendanceDto {
  @IsOptional()
  @IsEnum(AttendanceStatus, {
    message: 'Status must be one of: present, absent, late, excused',
  })
  status?: AttendanceStatus;

  @IsOptional()
  @IsString({ message: 'Remarks must be a string' })
  @MaxLength(500, { message: 'Remarks cannot exceed 500 characters' })
  remarks?: string;
}
