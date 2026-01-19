import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
@Controller('departments')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  async create(@Body() dto: CreateDepartmentDto) {
    return this.departmentService.Create(dto);
  }

  @Get()
  async findAll() {
    return this.departmentService.findAll();
  }

  @Get(':name')
  async findOne(@Param('name') name: string) {
    return this.departmentService.findOne(name);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.departmentService.remove(id);
  }
}
