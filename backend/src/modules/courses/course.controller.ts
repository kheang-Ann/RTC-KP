import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { JwtAuthGuard } from '../auth/guards/jaw-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';

interface RequestWithUser {
  user: {
    id: number;
    email: string;
    roles: string[];
  };
}

@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Roles('admin')
  @Post()
  async create(@Body() dto: CreateCourseDto) {
    return this.courseService.create(dto);
  }

  @Get()
  async findAll() {
    return this.courseService.findAll();
  }

  // Get courses assigned to the logged-in teacher
  @Get('my')
  @Roles('teacher', 'admin')
  async findMyCourses(@Req() req: RequestWithUser) {
    const isAdmin = req.user.roles?.includes('admin') ?? false;
    if (isAdmin) {
      return this.courseService.findAll();
    }
    return this.courseService.findByTeacher(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.courseService.findOne(id);
  }

  @Roles('admin')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.courseService.update(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.courseService.remove(id);
  }
}
