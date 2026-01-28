import {
  IsEmail,
  IsString,
  MinLength,
  IsInt,
  IsOptional,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;

  @IsOptional()
  @IsInt()
  roleId?: number;

  @IsOptional()
  @IsInt()
  departmentId?: number;
}
