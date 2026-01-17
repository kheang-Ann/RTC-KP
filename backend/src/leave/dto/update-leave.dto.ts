import { IsEnum, IsOptional, IsString } from 'class-validator';
import { LeaveStatus } from '../entities/leave.entity';

export class UpdateLeaveDto {
  @IsOptional()
  @IsEnum(LeaveStatus)
  status?: LeaveStatus;

  @IsOptional()
  @IsString()
  reviewedBy?: string;

  @IsOptional()
  @IsString()
  reviewComments?: string;

  // ADD THIS PROPERTY
  reviewedAt?: Date;
}
