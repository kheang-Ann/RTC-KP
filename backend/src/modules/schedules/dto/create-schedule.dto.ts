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
  @IsString()
  courseId: string;

  @IsInt()
  groupId: number;

  @IsInt()
  @Min(1)
  @Max(2)
  semester: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(52)
  semesterWeeks?: number;

  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @IsEnum(TimeSlot)
  startSlot: TimeSlot;

  @IsInt()
  @Min(1)
  @Max(4) // Maximum 4 hours block
  duration: number;

  @IsEnum(ScheduleType)
  type: ScheduleType;

  @IsString()
  roomNumber: string;

  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'Color must be a valid hex color code (e.g., #FF5733)',
  })
  color?: string;
}
