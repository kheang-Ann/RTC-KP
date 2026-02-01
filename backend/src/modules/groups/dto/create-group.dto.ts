import { IsString, IsInt, IsOptional, Min, Max } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  name: string;

  @IsInt()
  programId: number;

  @IsInt()
  @Min(1)
  @Max(10)
  academicYear: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  maxCapacity?: number;
}
