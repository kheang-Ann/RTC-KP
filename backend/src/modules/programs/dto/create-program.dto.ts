/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { DegreeType } from '../entities/program.entity';

export class CreateProgramDto {
  @IsString({ message: 'Program name must be a string' })
  @IsNotEmpty({ message: 'Program name is required' })
  @MaxLength(100, { message: 'Program name cannot exceed 100 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @Type(() => Number)
  @IsInt({ message: 'Duration is required' })
  @Min(1, { message: 'Duration must be at least 1 year' })
  duration: number;

  @IsEnum(DegreeType, { message: 'Please select a valid degree type' })
  degreeType: DegreeType;

  @Type(() => Number)
  @IsInt({ message: 'Department is required' })
  departmentId: number;
}
