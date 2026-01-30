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

export class CreateTeacherDto {
  // Personal Information
  @IsString()
  @IsNotEmpty()
  nameKhmer: string;

  @IsString()
  @IsNotEmpty()
  nameLatin: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsDateString()
  dob: string;

  // Department
  @IsInt()
  @Type(() => Number)
  departmentId: number;

  // Contact Information
  @IsEmail()
  personalEmail: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @Transform(({ value }): string[] =>
    typeof value === 'string' ? JSON.parse(value) : value,
  )
  phoneNumbers: string[];

  // Optional password for creating user account
  @IsOptional()
  @IsString()
  password?: string;
}
