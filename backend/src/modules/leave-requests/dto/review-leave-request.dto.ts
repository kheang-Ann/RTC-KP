import { IsEnum, IsOptional, IsString } from 'class-validator';
import { LeaveRequestStatus } from '../entities/leave-request.entity';

export class ReviewLeaveRequestDto {
  @IsEnum(LeaveRequestStatus)
  status: LeaveRequestStatus;

  @IsOptional()
  @IsString()
  reviewNote?: string;
}
