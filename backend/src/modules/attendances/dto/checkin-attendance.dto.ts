import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class CheckInDto {
  @IsNotEmpty({ message: 'Attendance code is required' })
  @IsString({ message: 'Attendance code must be a string' })
  @Length(4, 8, {
    message: 'Attendance code must be between 4 and 8 characters',
  })
  @Matches(/^[A-Za-z0-9]+$/, {
    message: 'Attendance code can only contain letters and numbers',
  })
  code: string;
}
