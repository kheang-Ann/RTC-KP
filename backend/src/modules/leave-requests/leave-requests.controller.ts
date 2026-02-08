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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { LeaveRequestsService } from './leave-requests.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { ReviewLeaveRequestDto } from './dto/review-leave-request.dto';
import { JwtAuthGuard } from '../auth/guards/jaw-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { RequesterType } from './entities/leave-request.entity';
import { leaveDocumentUploadConfig } from 'src/config/file-uploading.config';

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
  @Post('student')
  @Roles('student')
  @UseInterceptors(FileInterceptor('document', leaveDocumentUploadConfig))
  async createStudentRequest(
    @Body() dto: CreateLeaveRequestDto,
    @Req() req: RequestWithUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const documentPath = file
      ? `/uploads/leave-documents/${file.filename}`
      : undefined;
    return this.leaveRequestsService.create(
      dto,
      req.user.sub,
      RequesterType.STUDENT,
      documentPath,
    );
  }

  // Teacher creates leave request
  @Post('teacher')
  @Roles('teacher')
  @UseInterceptors(FileInterceptor('document', leaveDocumentUploadConfig))
  async createTeacherRequest(
    @Body() dto: CreateLeaveRequestDto,
    @Req() req: RequestWithUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const documentPath = file
      ? `/uploads/leave-documents/${file.filename}`
      : undefined;
    return this.leaveRequestsService.create(
      dto,
      req.user.sub,
      RequesterType.TEACHER,
      documentPath,
    );
  }

  // Get all leave requests (admin only)
  @Get()
  @Roles('admin')
  async findAll() {
    return this.leaveRequestsService.findAll();
  }

  // Get my leave requests (student or teacher)
  @Get('my')
  @Roles('student', 'teacher')
  async findMyLeaveRequests(@Req() req: RequestWithUser) {
    return this.leaveRequestsService.findByUser(req.user.sub);
  }

  // Get single leave request with details (admin)
  @Get(':id/details')
  @Roles('admin')
  async findOneWithDetails(@Param('id', ParseUUIDPipe) id: string) {
    return this.leaveRequestsService.findOneWithDetails(id);
  }

  // Get single leave request
  @Get(':id')
  @Roles('student', 'teacher', 'admin')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.leaveRequestsService.findOne(id);
  }

  // Admin reviews leave request
  @Patch(':id/review')
  @Roles('admin')
  async review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewLeaveRequestDto,
    @Req() req: RequestWithUser,
  ) {
    return this.leaveRequestsService.review(id, dto, req.user.sub);
  }

  // Delete leave request
  @Delete(':id')
  @Roles('student', 'teacher', 'admin')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ) {
    const isAdmin = req.user.roles?.includes('admin') ?? false;
    return this.leaveRequestsService.remove(id, req.user.sub, isAdmin);
  }
}
