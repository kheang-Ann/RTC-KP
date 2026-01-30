/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
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
  MinLength,
  Matches,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Gender } from '../entities/student.entity';

// Custom transformer to trim and normalize spaces (multiple spaces to single)
const TrimTransform = () =>
  Transform(({ value }) =>
    typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value,
  );

// Custom transformer for phone numbers - remove all spaces
const PhoneArrayTransform = () =>
  Transform(({ value }): string[] => {
    if (typeof value === 'string') {
      return JSON.parse(value).map((v: string) => v.replace(/\s/g, '').trim());
    }
    if (Array.isArray(value)) {
      return value.map((v: string) => v.replace(/\s/g, '').trim());
    }
    return value;
  });

export class CreateStudentDto {
  // Personal Information
  @IsString()
  @IsNotEmpty()
  @TrimTransform()
  nameKhmer: string;

  @IsString()
  @IsNotEmpty()
  @TrimTransform()
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

  @IsArray({ message: 'Phone numbers must be an array' })
  @ArrayMinSize(1, { message: 'At least one phone number is required' })
  @IsString({ each: true, message: 'Each phone number must be a string' })
  @Matches(/^0\d{8,10}$/, {
    each: true,
    message: 'Phone number must start with 0 and have 9-11 digits',
  })
  @PhoneArrayTransform()
  phoneNumbers: string[];

  @IsArray({ message: 'Emergency phone numbers must be an array' })
  @ArrayMinSize(1, {
    message: 'At least one emergency phone number is required',
  })
  @IsString({ each: true, message: 'Each phone number must be a string' })
  @Matches(/^0\d{8,10}$/, {
    each: true,
    message: 'Phone number must start with 0 and have 9-11 digits',
  })
  @PhoneArrayTransform()
  emergencyPhoneNumbers: string[];

  // Optional password for creating user account
  @IsOptional()
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @TrimTransform()
  password?: string;
}
