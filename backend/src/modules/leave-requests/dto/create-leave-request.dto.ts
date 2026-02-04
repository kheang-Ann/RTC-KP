import { IsString, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { LeaveType } from '../entities/leave-request.entity';

export class CreateLeaveRequestDto {
  @IsEnum(LeaveType, { message: 'Please select a valid leave type' })
  leaveType: LeaveType;

  @IsDateString({}, { message: 'Start date is required' })
  startDate: string;

  @IsDateString({}, { message: 'End date is required' })
  endDate: string;

  @IsString({ message: 'Reason is required' })
  reason: string;

  @IsOptional()
  @IsString()
  documentPath?: string;
}
