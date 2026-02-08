import { IsEmail, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
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
