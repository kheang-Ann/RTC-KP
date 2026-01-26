import { IsOptional, IsDateString, IsUUID, IsString } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  courseId: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;
}
