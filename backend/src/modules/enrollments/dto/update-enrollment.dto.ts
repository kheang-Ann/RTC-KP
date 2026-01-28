import { IsOptional, IsDateString } from 'class-validator';

export class UpdateEnrollmentDto {
  @IsOptional()
  @IsDateString()
  enrolledAt?: string;
}
