import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';
import { SessionStatus } from '../entities/session.entity';

export class UpdateSessionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;

  @IsOptional()
  isCodeActive?: boolean;
}
