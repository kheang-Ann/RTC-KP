/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCourseDto {
  @IsString({ message: 'Course name must be a string' })
  @IsNotEmpty({ message: 'Course name is required' })
  @MaxLength(100, { message: 'Course name cannot exceed 100 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @IsString({ message: 'Course code must be a string' })
  @IsNotEmpty({ message: 'Course code is required' })
  @MaxLength(20, { message: 'Course code cannot exceed 20 characters' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  code: string;

  @IsOptional()
  @IsInt({ message: 'Credits must be a number' })
  @Min(1, { message: 'Credits must be at least 1' })
  @Max(5, { message: 'Credits cannot exceed 5' })
  credits?: number;

  @IsOptional()
  @IsInt({ message: 'Department must be a valid ID' })
  departmentId?: number;

  @IsOptional()
  @IsInt({ message: 'Teacher must be a valid ID' })
  @Min(1, { message: 'Invalid teacher selected' })
  teacherId?: number;
}
