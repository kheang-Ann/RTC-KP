/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsDateString,
  IsEmail,
  IsArray,
  ArrayMinSize,
  IsOptional,
  MinLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Gender } from '../entities/teacher.entity';

// Custom transformer to trim strings
const TrimTransform = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

// Custom transformer to trim array of strings
const TrimArrayTransform = () =>
  Transform(({ value }): string[] => {
    if (typeof value === 'string') {
      return JSON.parse(value).map((v: string) => v.trim());
    }
    if (Array.isArray(value)) {
      return value.map((v: string) => v.trim());
    }
    return value;
  });

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

  // Login email (for user account)
  @IsOptional()
  @IsEmail()
  email?: string;

  // Contact Information
  @IsOptional()
  @IsEmail()
  personalEmail?: string;

  @IsOptional()
  @IsArray({ message: 'Phone numbers must be an array' })
  @ArrayMinSize(1, { message: 'At least one phone number is required' })
  @IsString({ each: true, message: 'Each phone number must be a string' })
  @Matches(/^0\d{8,10}$/, {
    each: true,
    message: 'Phone number must start with 0 and have 9-11 digits',
  })
  @TrimArrayTransform()
  phoneNumbers?: string[];

  // Optional password update
  @IsOptional()
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @TrimTransform()
  password?: string;
}
