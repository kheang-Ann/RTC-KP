import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LeaveService } from './leave.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';
import { LeaveFilterDto } from './dto/leave-filter.dto';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Uncomment when auth is ready

@Controller('leave')
// @UseGuards(JwtAuthGuard) // Uncomment when auth is ready
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Post()
  create(@Body() createLeaveDto: CreateLeaveDto) {
    return this.leaveService.create(createLeaveDto);
  }

  @Get()
  findAll(@Query() filters: LeaveFilterDto) {
    return this.leaveService.findAll(filters);
  }

  @Get('balance/:employeeId')
  getBalance(@Param('employeeId') employeeId: string) {
    return this.leaveService.getLeaveBalance(employeeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leaveService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLeaveDto: UpdateLeaveDto) {
    return this.leaveService.update(id, updateLeaveDto);
  }

  @Patch(':id/approve')
  approve(
    @Param('id') id: string,
    @Body('reviewedBy') reviewedBy: string,
    @Body('comments') comments?: string,
  ) {
    return this.leaveService.approve(id, reviewedBy, comments);
  }

  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @Body('reviewedBy') reviewedBy: string,
    @Body('comments') comments?: string,
  ) {
    return this.leaveService.reject(id, reviewedBy, comments);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.leaveService.cancel(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.leaveService.remove(id);
  }
}