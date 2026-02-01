import { Module } from '@nestjs/common';
import { DepartmentController } from './department.controller';
import { DepartmentService } from './department.service';
import { Department } from './entity/department.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Program } from '../programs/entities/program.entity';
import { Course } from '../courses/entities/course.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Department, Student, Teacher, Program, Course]),
  ],
  controllers: [DepartmentController],
  providers: [DepartmentService],
})
export class DepartmentModule {}
