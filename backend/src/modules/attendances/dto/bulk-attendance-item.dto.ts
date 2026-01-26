import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { AttendanceStatus } from '../entities/attendance.entity';

export class BulkAttendanceItemDto {
  @IsInt()
  studentId: number;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsOptional()
  @IsString()
  remarks?: string;
}
