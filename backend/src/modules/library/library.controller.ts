import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  Res,
  ParseIntPipe,
  Query,
  Patch,
  Request,
} from '@nestjs/common';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { type Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { LibraryService } from './library.service';
import { CreateLibraryItemDto, UpdateLibraryItemDto } from './dto/create-library-item.dto';
import { JwtAuthGuard } from '../auth/guards/jaw-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { Public } from '../auth/decorator/public.decorator';
import { LibraryItemCategory } from './entities/library-item.entity';

const uploadDir = path.join(__dirname, '../../../uploads/library');

@Controller('library')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LibraryController {
  constructor(private libraryService: LibraryService) {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  }

  @Post('upload')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'file', maxCount: 1 },
      { name: 'cover', maxCount: 1 },
    ]),
  )
  async uploadFile(
    @UploadedFiles() files: { file?: Express.Multer.File[], cover?: Express.Multer.File[] },
    @Body() createDto: any,
    @Request() req: any,
  ) {
    console.log('Upload endpoint called');
    console.log('Files received:', files ? Object.keys(files) : 'No files');
    console.log('Body received:', createDto);
    console.log('User:', req.user);
    console.log('User ID:', req.user?.id);

    if (!files || !files.file || files.file.length === 0) {
      throw new BadRequestException('File is required');
    }

    const mainFile = files.file[0];
    let mainFilePath: string | undefined;
    let coverImagePath: string | undefined;

    try {
      // Save main file
      const fileName = `${Date.now()}-${mainFile.originalname}`;
      mainFilePath = path.join(uploadDir, fileName);
      fs.writeFileSync(mainFilePath, mainFile.buffer);

      // Process cover image if provided
      if (files.cover && files.cover.length > 0) {
        const coverFile = files.cover[0];
        const coverFileName = `${Date.now()}-cover.webp`;
        coverImagePath = path.join(uploadDir, coverFileName);

        // Resize cover to standard book cover size (600x900px)
        await sharp(coverFile.buffer)
          .resize(600, 900, {
            fit: 'cover',
            position: 'center',
          })
          .webp({ quality: 90 })
          .toFile(coverImagePath);
      }

      const libraryItem = await this.libraryService.createLibraryItem(
        createDto,
        mainFile.originalname,
        mainFilePath,
        mainFile.size,
        mainFile.mimetype,
        req.user.sub,
        coverImagePath,
      );

      return {
        message: 'File uploaded successfully',
        item: libraryItem,
      };
    } catch (error) {
      if (mainFilePath && fs.existsSync(mainFilePath)) {
        fs.unlinkSync(mainFilePath);
      }
      if (coverImagePath && fs.existsSync(coverImagePath)) {
        fs.unlinkSync(coverImagePath);
      }
      throw error;
    }
  }

  @Get()
  async getAllItems(
    @Query('category') category?: LibraryItemCategory,
    @Query('search') search?: string,
  ) {
    const items = await this.libraryService.findAll(category, search);
    return {
      count: items.length,
      items,
    };
  }

  @Get('categories')
  async getCategories() {
    const categories = await this.libraryService.getCategories();
    return { categories };
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getStats() {
    return this.libraryService.getStats();
  }

  @Get(':id')
  async getItem(@Param('id', ParseIntPipe) id: number) {
    const item = await this.libraryService.findById(id);
    await this.libraryService.incrementViewCount(id);
    return item;
  }

  @Get(':id/download')
  async downloadFile(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const item = await this.libraryService.findById(id);

    if (!fs.existsSync(item.filePath)) {
      throw new BadRequestException('File not found on server');
    }

    await this.libraryService.incrementDownloadCount(id);

    res.download(item.filePath, item.fileName);
  }

  @Get(':id/cover')
  @Public()
  async getCoverImage(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const item = await this.libraryService.findById(id);

    if (!item.coverImagePath || !fs.existsSync(item.coverImagePath)) {
      throw new BadRequestException('Cover image not found');
    }

    res.sendFile(item.coverImagePath);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async updateItem(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateLibraryItemDto) {
    return this.libraryService.updateLibraryItem(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async deleteItem(@Param('id', ParseIntPipe) id: number) {
    const item = await this.libraryService.findById(id);

    if (fs.existsSync(item.filePath)) {
      fs.unlinkSync(item.filePath);
    }

    await this.libraryService.deleteLibraryItem(id);

    return { message: 'Library item deleted successfully' };
  }
}
