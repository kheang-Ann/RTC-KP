import { IsOptional, IsEnum, IsString } from 'class-validator';
import { AttendanceStatus } from '../entities/attendance.entity';

export class UpdateAttendanceDto {
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @IsOptional()
  @IsString()
  remarks?: string;
}
