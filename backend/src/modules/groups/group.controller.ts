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
} from '@nestjs/common';
import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddStudentsToGroupDto } from './dto/add-students-to-group.dto';

@Controller('groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Get()
  findAll() {
    return this.groupService.findAll();
  }

  @Get('by-program/:programId')
  findByProgram(@Param('programId', ParseIntPipe) programId: number) {
    return this.groupService.findByProgram(programId);
  }

  @Get('by-program/:programId/year/:year')
  findByProgramAndYear(
    @Param('programId', ParseIntPipe) programId: number,
    @Param('year', ParseIntPipe) year: number,
  ) {
    return this.groupService.findByProgramAndYear(programId, year);
  }

  @Get('available-students')
  getAvailableStudents(
    @Query('programId', ParseIntPipe) programId: number,
    @Query('academicYear', ParseIntPipe) academicYear: number,
  ) {
    return this.groupService.getAvailableStudents(programId, academicYear);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.groupService.findOne(id);
  }

  @Get(':id/students')
  getStudentsInGroup(@Param('id', ParseIntPipe) id: number) {
    return this.groupService.getStudentsInGroup(id);
  }

  @Post()
  create(@Body() dto: CreateGroupDto) {
    return this.groupService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateGroupDto) {
    return this.groupService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.groupService.remove(id);
  }

  @Post(':id/students')
  addStudentsToGroup(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddStudentsToGroupDto,
  ) {
    return this.groupService.addStudentsToGroup(id, dto.studentIds);
  }

  @Delete(':id/students/:studentId')
  removeStudentFromGroup(
    @Param('id', ParseIntPipe) id: number,
    @Param('studentId', ParseIntPipe) studentId: number,
  ) {
    return this.groupService.removeStudentFromGroup(id, studentId);
  }
}
