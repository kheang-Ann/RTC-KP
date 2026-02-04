import { IsString, IsInt, IsOptional, Min, Max, IsNotEmpty } from 'class-validator';

export class CreateGroupDto {
  @IsString({ message: 'Group name is required' })
  @IsNotEmpty({ message: 'Group name cannot be empty' })
  name: string;

  @IsInt({ message: 'Program is required' })
  programId: number;

  @IsInt({ message: 'Academic year is required' })
  @Min(1, { message: 'Academic year must be at least 1' })
  @Max(10, { message: 'Academic year cannot exceed 10' })
  academicYear: number;

  @IsOptional()
  @IsInt({ message: 'Max capacity must be a number' })
  @Min(1, { message: 'Max capacity must be at least 1' })
  @Max(500, { message: 'Max capacity cannot exceed 500' })
  maxCapacity?: number;
}
