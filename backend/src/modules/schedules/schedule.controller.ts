import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { JwtAuthGuard } from '../auth/guards/jaw-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';

interface RequestWithUser {
  user: {
    sub: number;
    id?: number;
    email: string;
    roles: string[];
    studentId?: number;
    groupId?: number;
    teacherId?: number;
  };
}

@Controller('schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get()
  findAll() {
    return this.scheduleService.findAll();
  }

  @Get('time-slots')
  getTimeSlots() {
    return this.scheduleService.getTimeSlots();
  }

  @Get('days-of-week')
  getDaysOfWeek() {
    return this.scheduleService.getDaysOfWeek();
  }

  // Get my schedule (for students - based on their group)
  @Get('my')
  @Roles('student')
  async findMySchedule(
    @Req() req: RequestWithUser,
    @Query('semester') semester?: string,
  ) {
    const groupId = req.user.groupId;
    if (!groupId) {
      return []; // Student not assigned to a group yet
    }
    return this.scheduleService.findByGroup(
      groupId,
      semester ? parseInt(semester) : undefined,
    );
  }

  // Get my teaching schedule (for teachers)
  @Get('my-teaching')
  @Roles('teacher')
  async findMyTeachingSchedule(
    @Req() req: RequestWithUser,
    @Query('semester') semester?: string,
  ) {
    const teacherId = req.user.teacherId;
    if (!teacherId) {
      return []; // Teacher not found in system
    }
    return this.scheduleService.findByTeacher(
      teacherId,
      semester ? parseInt(semester) : undefined,
    );
  }

  @Get('by-group/:groupId')
  findByGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Query('semester') semester?: string,
  ) {
    return this.scheduleService.findByGroup(
      groupId,
      semester ? parseInt(semester) : undefined,
    );
  }

  @Get('by-group/:groupId/formatted')
  findByGroupFormatted(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Query('semester') semester?: string,
  ) {
    return this.scheduleService.findByGroupFormatted(
      groupId,
      semester ? parseInt(semester) : undefined,
    );
  }

  @Get('by-course/:courseId')
  findByCourse(@Param('courseId') courseId: string) {
    return this.scheduleService.findByCourse(courseId);
  }

  @Get('by-teacher/:teacherId')
  findByTeacher(
    @Param('teacherId', ParseIntPipe) teacherId: number,
    @Query('semester') semester?: string,
  ) {
    return this.scheduleService.findByTeacher(
      teacherId,
      semester ? parseInt(semester) : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.scheduleService.findOne(id);
  }

  @Post()
  @Roles('admin')
  create(@Body() dto: CreateScheduleDto) {
    return this.scheduleService.create(dto);
  }

  @Patch(':id')
  @Roles('admin')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateScheduleDto,
  ) {
    return this.scheduleService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.scheduleService.remove(id);
  }
}
