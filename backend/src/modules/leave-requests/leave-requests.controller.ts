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
  ParseUUIDPipe,
} from '@nestjs/common';
import { LeaveRequestsService } from './leave-requests.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { ReviewLeaveRequestDto } from './dto/review-leave-request.dto';
import { JwtAuthGuard } from '../auth/guards/jaw-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';

interface RequestWithUser {
  user: {
    sub: number;
    email: string;
    roles: string[];
  };
}

@Controller('leave-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaveRequestsController {
  constructor(private readonly leaveRequestsService: LeaveRequestsService) {}

  // Student creates leave request
  @Post()
  @Roles('student')
  async create(
    @Body() dto: CreateLeaveRequestDto,
    @Req() req: RequestWithUser,
  ) {
    return this.leaveRequestsService.create(dto, req.user.sub);
  }

  // Get all leave requests (admin only)
  @Get()
  @Roles('admin')
  async findAll() {
    return this.leaveRequestsService.findAll();
  }

  // Get my leave requests (student)
  @Get('my')
  @Roles('student')
  async findMyLeaveRequests(@Req() req: RequestWithUser) {
    return this.leaveRequestsService.findByStudent(req.user.sub);
  }

  // Get leave requests for teacher's courses
  @Get('teacher')
  @Roles('teacher', 'admin')
  async findTeacherLeaveRequests(@Req() req: RequestWithUser) {
    const isAdmin = req.user.roles?.includes('admin') ?? false;
    if (isAdmin) {
      return this.leaveRequestsService.findAll();
    }
    return this.leaveRequestsService.findByTeacher(req.user.sub);
  }

  // Get leave requests by course
  @Get('course/:courseId')
  @Roles('teacher', 'admin')
  async findByCourse(@Param('courseId', ParseUUIDPipe) courseId: string) {
    return this.leaveRequestsService.findByCourse(courseId);
  }

  // Get single leave request
  @Get(':id')
  @Roles('student', 'teacher', 'admin')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.leaveRequestsService.findOne(id);
  }

  // Teacher/Admin reviews leave request
  @Patch(':id/review')
  @Roles('teacher', 'admin')
  async review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewLeaveRequestDto,
    @Req() req: RequestWithUser,
  ) {
    const isAdmin = req.user.roles?.includes('admin') ?? false;
    return this.leaveRequestsService.review(id, dto, req.user.sub, isAdmin);
  }

  // Delete leave request
  @Delete(':id')
  @Roles('student', 'admin')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ) {
    const isAdmin = req.user.roles?.includes('admin') ?? false;
    return this.leaveRequestsService.remove(id, req.user.sub, isAdmin);
  }
}
