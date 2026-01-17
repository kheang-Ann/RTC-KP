import { IsOptional, IsEnum, IsString, IsDateString } from 'class-validator';
import { LeaveType, LeaveStatus } from '../entities/leave.entity';

export class LeaveFilterDto {
  @IsOptional()
  @IsEnum(LeaveType)
  type?: LeaveType;

  @IsOptional()
  @IsEnum(LeaveStatus)
  status?: LeaveStatus;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}