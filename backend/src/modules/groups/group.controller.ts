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
  UseGuards,
} from '@nestjs/common';
import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddStudentsToGroupDto } from './dto/add-students-to-group.dto';
import { JwtAuthGuard } from '../auth/guards/jaw-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';

@Controller('groups')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Get()
  @Roles('admin', 'teacher')
  findAll() {
    return this.groupService.findAll();
  }

  @Get('by-program/:programId')
  @Roles('admin', 'teacher')
  findByProgram(@Param('programId', ParseIntPipe) programId: number) {
    return this.groupService.findByProgram(programId);
  }

  @Get('by-program/:programId/year/:year')
  @Roles('admin', 'teacher')
  findByProgramAndYear(
    @Param('programId', ParseIntPipe) programId: number,
    @Param('year', ParseIntPipe) year: number,
  ) {
    return this.groupService.findByProgramAndYear(programId, year);
  }

  @Get('available-students')
  @Roles('admin')
  getAvailableStudents(
    @Query('programId', ParseIntPipe) programId: number,
    @Query('academicYear', ParseIntPipe) academicYear: number,
  ) {
    return this.groupService.getAvailableStudents(programId, academicYear);
  }

  @Get(':id')
  @Roles('admin', 'teacher')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.groupService.findOne(id);
  }

  @Get(':id/students')
  @Roles('admin', 'teacher')
  getStudentsInGroup(@Param('id', ParseIntPipe) id: number) {
    return this.groupService.getStudentsInGroup(id);
  }

  @Post()
  @Roles('admin')
  create(@Body() dto: CreateGroupDto) {
    return this.groupService.create(dto);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateGroupDto) {
    return this.groupService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.groupService.remove(id);
  }

  @Post(':id/students')
  @Roles('admin')
  addStudentsToGroup(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddStudentsToGroupDto,
  ) {
    return this.groupService.addStudentsToGroup(id, dto.studentIds);
  }

  @Delete(':id/students/:studentId')
  @Roles('admin')
  removeStudentFromGroup(
    @Param('id', ParseIntPipe) id: number,
    @Param('studentId', ParseIntPipe) studentId: number,
  ) {
    return this.groupService.removeStudentFromGroup(id, studentId);
  }
}
