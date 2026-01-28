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
  UseGuards,
  Req,
} from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { JwtAuthGuard } from '../auth/guards/jaw-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';

@Controller('enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Post()
  @Roles('admin')
  async create(@Body() dto: CreateEnrollmentDto) {
    return this.enrollmentService.create(dto);
  }

  @Get()
  @Roles('admin', 'teacher')
  async findAll() {
    return this.enrollmentService.findAll();
  }

  // Get my enrollments (for student)
  @Get('my')
  @Roles('student')
  async findMyEnrollments(@Req() req: any) {
    return this.enrollmentService.findByStudent(req.user.sub);
  }

  @Get(':id')
  @Roles('admin', 'teacher')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.enrollmentService.findOne(id);
  }

  @Get('student/:studentId')
  @Roles('admin', 'teacher')
  async findByStudent(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.enrollmentService.findByStudent(studentId);
  }

  @Get('course/:courseId')
  @Roles('admin', 'teacher')
  async findByCourse(@Param('courseId', ParseUUIDPipe) courseId: string) {
    return this.enrollmentService.findByCourse(courseId);
  }

  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEnrollmentDto,
  ) {
    return this.enrollmentService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.enrollmentService.remove(id);
  }
}
