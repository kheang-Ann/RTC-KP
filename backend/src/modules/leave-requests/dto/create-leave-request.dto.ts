import { IsUUID, IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateLeaveRequestDto {
  @IsUUID()
  courseId: string;

  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @IsDateString()
  leaveDate: string;

  @IsString()
  reason: string;
}
