import { IsEmail, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @IsString({ message: 'Name must be a string' })
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  name: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  email: string;

  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  password: string;
}
