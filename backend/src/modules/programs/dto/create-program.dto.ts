import { IsEnum, IsInt, IsNotEmpty, IsString, Min, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { DegreeType } from '../entities/program.entity';

export class CreateProgramDto {
  @IsString({ message: 'Program name must be a string' })
  @IsNotEmpty({ message: 'Program name is required' })
  @MaxLength(100, { message: 'Program name cannot exceed 100 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @IsInt()
  @Min(1)
  duration: number;

  @IsEnum(DegreeType)
  degreeType: DegreeType;

  @IsInt()
  departmentId: number;
}
