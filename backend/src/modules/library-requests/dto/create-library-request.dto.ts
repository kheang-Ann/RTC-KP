import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { RequestStatus } from '../entities/library-request.entity';

export class CreateLibraryRequestDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  author?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  justification?: string;
}

export class UpdateLibraryRequestStatusDto {
  @IsEnum(RequestStatus)
  status: RequestStatus;

  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
