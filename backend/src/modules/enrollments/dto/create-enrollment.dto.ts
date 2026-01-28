import { IsOptional, IsInt, IsDateString, IsUUID } from 'class-validator';

export class CreateEnrollmentDto {
  @IsUUID()
  courseId: string;

  @IsInt()
  studentId: number;

  @IsOptional()
  @IsDateString()
  enrolledAt?: string;
}
