import { Type } from 'class-transformer';
import { IsUUID, IsArray, ValidateNested } from 'class-validator';
import { BulkAttendanceItemDto } from './bulk-attendance-item.dto';

export class BulkMarkAttendanceDto {
  @IsUUID()
  sessionId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkAttendanceItemDto)
  attendances: BulkAttendanceItemDto[];
}
