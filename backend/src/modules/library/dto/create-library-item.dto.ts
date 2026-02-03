import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { LibraryItemCategory } from '../entities/library-item.entity';

export class CreateLibraryItemDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  author?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(LibraryItemCategory)
  @IsOptional()
  category?: LibraryItemCategory;
}

export class UpdateLibraryItemDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  author?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(LibraryItemCategory)
  @IsOptional()
  category?: LibraryItemCategory;
}
