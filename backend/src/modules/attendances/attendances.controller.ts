/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AttendancesService } from './attendances.service';
import { CheckInDto } from './dto/checkin-attendance.dto';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { BulkMarkAttendanceDto } from './dto/bulk-mark-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jaw-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';

@Controller('attendances')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @Post('check-in')
  @Roles('student')
  async checkIn(@Body() dto: CheckInDto, @Req() req: any) {
    return this.attendancesService.checkIn(dto, req.user.sub);
  }

  @Post('mark')
  @Roles('teacher', 'admin')
  async markAttendance(@Body() dto: MarkAttendanceDto, @Req() req: any) {
    const isAdmin = req.user.roles?.includes('admin') ?? false;
    return this.attendancesService.markAttendance(dto, req.user.sub, isAdmin);
  }

  @Post('bulk-mark')
  @Roles('teacher', 'admin')
  async bulkMarkAttendance(
    @Body() dto: BulkMarkAttendanceDto,
    @Req() req: any,
  ) {
    const isAdmin = req.user.roles?.includes('admin') ?? false;
    return this.attendancesService.bulkMarkAttendance(dto, req.user.sub, isAdmin);
  }

  @Get('session/:sessionId')
  @Roles('teacher', 'admin')
  async findBySession(@Param('sessionId') sessionId: string) {
    return this.attendancesService.findBySession(sessionId);
  }

  @Get('session/:sessionId/summary')
  @Roles('teacher', 'admin')
  async getSessionSummary(@Param('sessionId') sessionId: string) {
    return this.attendancesService.getSessionSummary(sessionId);
  }

  @Get('my')
  @Roles('student')
  async findMyAttendance(@Req() req: any) {
    return this.attendancesService.findByStudent(req.user.sub);
  }

  @Get('my/course/:courseId')
  @Roles('student')
  async findMyAttendanceByCourse(
    @Param('courseId') courseId: string,
    @Req() req: any,
  ) {
    return this.attendancesService.findByStudentAndCourse(
      req.user.sub,
      courseId,
    );
  }

  @Get('student/:studentId')
  @Roles('teacher', 'admin')
  async findByStudent(@Param('studentId') studentId: string) {
    return this.attendancesService.findByStudent(parseInt(studentId));
  }

  @Patch(':id')
  @Roles('teacher', 'admin')
  async update(@Param('id') id: string, @Body() dto: UpdateAttendanceDto) {
    return this.attendancesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('teacher', 'admin')
  async remove(@Param('id') id: string) {
    return this.attendancesService.remove(id);
  }
}
