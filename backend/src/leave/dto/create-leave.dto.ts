import { IsEnum, IsNotEmpty, IsString, IsDateString, IsOptional, IsArray } from 'class-validator';
import { LeaveType } from '../entities/leave.entity';

export class CreateLeaveDto {
  @IsNotEmpty()
  @IsString()
  employeeId: string;

  @IsNotEmpty()
  @IsString()
  employeeName: string;

  @IsNotEmpty()
  @IsEnum(LeaveType)
  type: LeaveType;

  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @IsNotEmpty()
  @IsString()
  reason: string;

  @IsOptional()
  @IsArray()
  documents?: string[];
}
