import { IsOptional, IsString, IsInt, Min } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsInt()
  departmentId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  teacherId?: number;
}
