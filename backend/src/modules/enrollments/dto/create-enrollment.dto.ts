import { IsOptional, IsInt, IsDateString, IsUUID, IsEnum } from 'class-validator';
import { EnrollmentStatus } from '../entities/enrollment.entity';

export class CreateEnrollmentDto {
  @IsUUID()
  courseId: string;

  @IsInt()
  studentId: number;

  @IsOptional()
  @IsDateString()
  enrolledAt?: string;

  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;
}
