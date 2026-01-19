import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  ParseIntPipe,
  Post,
  Patch,
} from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';

@Controller('enrollments')
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Post()
  async create(@Body() dto: CreateEnrollmentDto) {
    return this.enrollmentService.create(dto);
  }

  @Get()
  async findAll() {
    return this.enrollmentService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.enrollmentService.findOne(id);
  }

  @Get('student/:studentId')
  async findByStudent(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.enrollmentService.findByStudent(studentId);
  }

  @Get('course/:courseId')
  async findByCourse(@Param('courseId', ParseUUIDPipe) courseId: string) {
    return this.enrollmentService.findByCourse(courseId);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEnrollmentDto,
  ) {
    return this.enrollmentService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.enrollmentService.remove(id);
  }
}
