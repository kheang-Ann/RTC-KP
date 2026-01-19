import {
  IsEmail,
  IsString,
  MinLength,
  IsInt,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  name: string;

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
