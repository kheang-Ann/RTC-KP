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
  MinLength,
  Matches,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Gender, AcademicStatus } from '../entities/student.entity';

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
  @IsArray({ message: 'Phone numbers must be an array' })
  @ArrayMinSize(1, { message: 'At least one phone number is required' })
  @IsString({ each: true, message: 'Each phone number must be a string' })
  @Matches(/^0\d{8,10}$/, {
    each: true,
    message: 'Phone number must start with 0 and have 9-11 digits',
  })
  @TrimArrayTransform()
  phoneNumbers?: string[];

  @IsOptional()
  @IsArray({ message: 'Emergency phone numbers must be an array' })
  @ArrayMinSize(1, { message: 'At least one emergency phone number is required' })
  @IsString({ each: true, message: 'Each phone number must be a string' })
  @Matches(/^0\d{8,10}$/, {
    each: true,
    message: 'Phone number must start with 0 and have 9-11 digits',
  })
  @TrimArrayTransform()
  emergencyPhoneNumbers?: string[];

  // Optional password update
  @IsOptional()
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @TrimTransform()
  password?: string;
}
