/* eslint-disable @typescript-eslint/no-unsafe-return */
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
import { Gender } from '../entities/student.entity';

export class CreateStudentDto {
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

  // Academic Information
  @IsInt()
  @Type(() => Number)
  departmentId: number;

  @IsInt()
  @Type(() => Number)
  programId: number;

  // Contact Information
  @IsEmail()
  personalEmail: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value,
  )
  phoneNumbers: string[];

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value,
  )
  emergencyPhoneNumbers: string[];

  // Optional password for creating user account
  @IsOptional()
  @IsString()
  password?: string;
}
