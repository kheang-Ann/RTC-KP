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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { JwtAuthGuard } from '../auth/guards/jaw-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { studentUploadConfig } from 'src/config/file-uploading.config';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Roles('admin')
  @Post()
  @UseInterceptors(FileInterceptor('image', studentUploadConfig))
  async create(
    @Body() dto: CreateStudentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const imagePath = file ? `/uploads/students/${file.filename}` : undefined;
    return this.studentService.create(dto, imagePath);
  }

  @Roles('admin', 'teacher')
  @Get()
  async findAll() {
    return this.studentService.findAll();
  }

  @Roles('admin', 'teacher')
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.studentService.findOne(id);
  }

  @Roles('admin')
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image', studentUploadConfig))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStudentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const imagePath = file ? `/uploads/students/${file.filename}` : undefined;
    return this.studentService.update(id, dto, imagePath);
  }

  @Roles('admin')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.studentService.remove(id);
  }
}
