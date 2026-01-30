import { Type } from 'class-transformer';
import {
  IsUUID,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  ArrayNotEmpty,
  ArrayMaxSize,
} from 'class-validator';
import { BulkAttendanceItemDto } from './bulk-attendance-item.dto';

export class BulkMarkAttendanceDto {
  @IsNotEmpty({ message: 'Session ID is required' })
  @IsUUID('4', { message: 'Session ID must be a valid UUID' })
  sessionId: string;

  @IsArray({ message: 'Attendances must be an array' })
  @ArrayNotEmpty({ message: 'At least one attendance record is required' })
  @ArrayMaxSize(200, {
    message: 'Cannot process more than 200 attendance records at once',
  })
  @ValidateNested({ each: true })
  @Type(() => BulkAttendanceItemDto)
  attendances: BulkAttendanceItemDto[];
}
