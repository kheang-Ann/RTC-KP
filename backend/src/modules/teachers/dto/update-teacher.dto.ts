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
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Gender } from '../entities/teacher.entity';

export class UpdateTeacherDto {
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

  // Department
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  departmentId?: number;

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

  // Optional password update
  @IsOptional()
  @IsString()
  password?: string;
}
