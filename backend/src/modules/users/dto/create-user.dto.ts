import { IsEmail, IsString, MinLength, IsInt } from 'class-validator';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;

  @IsInt()
  roleId?: number;
}
