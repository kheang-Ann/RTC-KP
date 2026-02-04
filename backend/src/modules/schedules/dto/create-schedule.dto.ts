import {
  IsString,
  IsInt,
  IsEnum,
  IsOptional,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { DayOfWeek, ScheduleType, TimeSlot } from '../entities/schedule.entity';

export class CreateScheduleDto {
  @IsString({ message: 'Course is required' })
  courseId: string;

  @IsInt({ message: 'Group is required' })
  groupId: number;

  @IsInt({ message: 'Semester is required' })
  @Min(1, { message: 'Semester must be 1 or 2' })
  @Max(2, { message: 'Semester must be 1 or 2' })
  semester: number;

  @IsOptional()
  @IsInt({ message: 'Semester weeks must be a number' })
  @Min(1, { message: 'Semester weeks must be at least 1' })
  @Max(52, { message: 'Semester weeks cannot exceed 52' })
  semesterWeeks?: number;

  @IsEnum(DayOfWeek, { message: 'Please select a valid day of week' })
  dayOfWeek: DayOfWeek;

  @IsEnum(TimeSlot, { message: 'Please select a valid time slot' })
  startSlot: TimeSlot;

  @IsInt({ message: 'Duration is required' })
  @Min(1, { message: 'Duration must be at least 1 hour' })
  @Max(4, { message: 'Duration cannot exceed 4 hours' })
  duration: number;

  @IsEnum(ScheduleType, { message: 'Please select a valid schedule type' })
  type: ScheduleType;

  @IsString({ message: 'Room number is required' })
  roomNumber: string;

  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'Color must be a valid hex color code (e.g., #FF5733)',
  })
  color?: string;
}
