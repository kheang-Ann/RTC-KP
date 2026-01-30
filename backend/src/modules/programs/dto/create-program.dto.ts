import { IsEnum, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { DegreeType } from '../entities/program.entity';

export class CreateProgramDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(1)
  duration: number;

  @IsEnum(DegreeType)
  degreeType: DegreeType;

  @IsInt()
  departmentId: number;
}
