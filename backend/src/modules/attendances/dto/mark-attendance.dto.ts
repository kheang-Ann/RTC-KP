import { IsUUID, IsInt, IsEnum, IsOptional, IsString } from 'class-validator';
import { AttendanceStatus } from '../entities/attendance.entity';

export class MarkAttendanceDto {
  @IsUUID()
  sessionId: string;

  @IsInt()
  studentId: number;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsOptional()
  @IsString()
  remarks?: string;
}
