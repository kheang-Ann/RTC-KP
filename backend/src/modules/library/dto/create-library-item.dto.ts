import { IsString, IsEnum, IsOptional } from 'class-validator';
import { LibraryItemCategory } from '../entities/library-item.entity';

export class CreateLibraryItemDto {
  @IsString({ message: 'Title is required' })
  title: string;

  @IsString({ message: 'Author must be a string' })
  @IsOptional()
  author?: string;

  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  description?: string;

  @IsEnum(LibraryItemCategory, { message: 'Please select a valid category' })
  @IsOptional()
  category?: LibraryItemCategory;
}

export class UpdateLibraryItemDto {
  @IsString({ message: 'Title must be a string' })
  @IsOptional()
  title?: string;

  @IsString({ message: 'Author must be a string' })
  @IsOptional()
  author?: string;

  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  description?: string;

  @IsEnum(LibraryItemCategory, { message: 'Please select a valid category' })
  @IsOptional()
  category?: LibraryItemCategory;
}
