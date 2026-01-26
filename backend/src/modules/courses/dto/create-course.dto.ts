import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  credits?: number;

  @IsOptional()
  @IsInt()
  departmentId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  teacherId?: number;
}
