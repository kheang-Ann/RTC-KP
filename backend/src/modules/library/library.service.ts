import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LibraryItem, LibraryItemCategory } from './entities/library-item.entity';
import { CreateLibraryItemDto, UpdateLibraryItemDto } from './dto/create-library-item.dto';

@Injectable()
export class LibraryService {
  constructor(
    @InjectRepository(LibraryItem)
    private libraryRepo: Repository<LibraryItem>,
  ) {}

  async createLibraryItem(
    createDto: CreateLibraryItemDto,
    fileName: string,
    filePath: string,
    fileSize: number,
    fileType: string,
    uploadedBy: number,
    coverImagePath?: string,
  ): Promise<LibraryItem> {
    const libraryItem = this.libraryRepo.create({
      ...createDto,
      fileName,
      filePath,
      fileSize,
      fileType,
      uploadedBy,
      coverImagePath,
      category: createDto.category || LibraryItemCategory.OTHER,
      isPublished: true,
    });

    return this.libraryRepo.save(libraryItem);
  }

  async findAll(category?: LibraryItemCategory, search?: string): Promise<LibraryItem[]> {
    const query = this.libraryRepo.createQueryBuilder('item').where('item.isPublished = :isPublished', { isPublished: true });

    if (category) {
      query.andWhere('item.category = :category', { category });
    }

    if (search) {
      query.andWhere(
        '(item.title ILIKE :search OR item.author ILIKE :search OR item.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    query.orderBy('item.createdAt', 'DESC');
    return query.getMany();
  }

  async findById(id: number): Promise<LibraryItem> {
    const item = await this.libraryRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Library item with id ${id} not found`);
    }
    return item;
  }

  async incrementViewCount(id: number): Promise<void> {
    await this.libraryRepo.increment({ id }, 'viewCount', 1);
  }

  async incrementDownloadCount(id: number): Promise<void> {
    await this.libraryRepo.increment({ id }, 'downloadCount', 1);
  }

  async updateLibraryItem(id: number, updateDto: UpdateLibraryItemDto): Promise<LibraryItem> {
    const item = await this.findById(id);
    Object.assign(item, updateDto);
    return this.libraryRepo.save(item);
  }

  async deleteLibraryItem(id: number): Promise<void> {
    const item = await this.findById(id);
    await this.libraryRepo.remove(item);
  }

  async getCategories(): Promise<LibraryItemCategory[]> {
    return Object.values(LibraryItemCategory);
  }

  async getStats(): Promise<{ totalItems: number; totalDownloads: number; totalViews: number }> {
    const items = await this.libraryRepo.find();
    const totalDownloads = items.reduce((sum, item) => sum + item.downloadCount, 0);
    const totalViews = items.reduce((sum, item) => sum + item.viewCount, 0);

    return {
      totalItems: items.length,
      totalDownloads,
      totalViews,
    };
  }
}
