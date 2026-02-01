import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TeacherService } from './teacher.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { JwtAuthGuard } from '../auth/guards/jaw-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { teacherUploadConfig } from 'src/config/file-uploading.config';

@Controller('teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Roles('admin')
  @Post()
  @UseInterceptors(FileInterceptor('image', teacherUploadConfig))
  async create(
    @Body() dto: CreateTeacherDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const imagePath = file ? `/uploads/teachers/${file.filename}` : undefined;
    return this.teacherService.create(dto, imagePath);
  }

  @Roles('admin')
  @Get()
  async findAll() {
    return this.teacherService.findAll();
  }

  @Roles('teacher')
  @Get('me')
  async getMyProfile(@Request() req) {
    return this.teacherService.findByUserId(req.user.sub);
  }

  @Roles('admin')
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.teacherService.findOne(id);
  }

  @Roles('admin')
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image', teacherUploadConfig))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTeacherDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const imagePath = file ? `/uploads/teachers/${file.filename}` : undefined;
    return this.teacherService.update(id, dto, imagePath);
  }

  @Roles('admin')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.teacherService.remove(id);
  }
}
