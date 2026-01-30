import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsDateString,
  IsInt,
  IsEmail,
  IsArray,
  ArrayMinSize,
  IsOptional,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Gender, AcademicStatus } from '../entities/student.entity';

export class UpdateStudentDto {
  // Personal Information
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nameKhmer?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nameLatin?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsDateString()
  dob?: string;

  // Academic Information
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  departmentId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  programId?: number;

  @IsOptional()
  @IsEnum(AcademicStatus)
  academicStatus?: AcademicStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  academicYear?: number;

  // Login email (for user account)
  @IsOptional()
  @IsEmail()
  email?: string;

  // Contact Information
  @IsOptional()
  @IsEmail()
  personalEmail?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @Transform(({ value }): string[] =>
    typeof value === 'string' ? JSON.parse(value) : value,
  )
  phoneNumbers?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @Transform(({ value }): string[] =>
    typeof value === 'string' ? JSON.parse(value) : value,
  )
  emergencyPhoneNumbers?: string[];

  // Optional password update
  @IsOptional()
  @IsString()
  password?: string;
}
