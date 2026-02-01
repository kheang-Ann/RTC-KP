import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Department } from './entity/department.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Program } from '../programs/entities/program.entity';
import { Course } from '../courses/entities/course.entity';

@Injectable()
export class DepartmentService {
  constructor(
    @InjectRepository(Department)
    private departmentRepo: Repository<Department>,
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(Teacher)
    private teacherRepo: Repository<Teacher>,
    @InjectRepository(Program)
    private programRepo: Repository<Program>,
    @InjectRepository(Course)
    private courseRepo: Repository<Course>,
  ) {}

  async Create(dto: Partial<Department>) {
    // Check for duplicate name (case-insensitive)
    if (dto.name) {
      const trimmedName = dto.name.trim();
      const existing = await this.departmentRepo
        .createQueryBuilder('department')
        .where('LOWER(department.name) = LOWER(:name)', { name: trimmedName })
        .getOne();
      if (existing) {
        throw new ConflictException(
          `Department with name '${trimmedName}' already exists`,
        );
      }
      dto.name = trimmedName;
    }
    const newDepartment = this.departmentRepo.create(dto);
    return this.departmentRepo.save(newDepartment);
  }

  async findAll() {
    const department = await this.departmentRepo.find();
    if (!department) {
      throw new NotFoundException(`No departments found`);
    }
    return department;
  }

  async findOne(name: string) {
    const department = await this.departmentRepo.findOne({ where: { name } });
    if (!department) {
      throw new NotFoundException(`Department with name ${name} not found`);
    }
    return department;
  }

  async remove(id: number) {
    const department = await this.departmentRepo.findOne({ where: { id } });
    if (!department) {
      throw new NotFoundException(`Department with id ${id} not found`);
    }

    // Check for related students
    const studentsCount = await this.studentRepo.count({
      where: { departmentId: id },
    });
    if (studentsCount > 0) {
      throw new BadRequestException(
        `Cannot delete department. Please remove ${studentsCount} student(s) first.`,
      );
    }

    // Check for related teachers
    const teachersCount = await this.teacherRepo.count({
      where: { departmentId: id },
    });
    if (teachersCount > 0) {
      throw new BadRequestException(
        `Cannot delete department. Please remove ${teachersCount} teacher(s) first.`,
      );
    }

    // Check for related programs
    const programsCount = await this.programRepo.count({
      where: { departmentId: id },
    });
    if (programsCount > 0) {
      throw new BadRequestException(
        `Cannot delete department. Please remove ${programsCount} program(s) first.`,
      );
    }

    // Check for related courses
    const coursesCount = await this.courseRepo.count({
      where: { departmentId: id },
    });
    if (coursesCount > 0) {
      throw new BadRequestException(
        `Cannot delete department. Please remove ${coursesCount} course(s) first.`,
      );
    }

    return this.departmentRepo.remove(department);
  }

  async update(id: number, dto: Partial<Department>) {
    const department = await this.departmentRepo.findOne({ where: { id } });
    if (!department) {
      throw new NotFoundException(`Department with id ${id} not found`);
    }
    // Check for duplicate name (case-insensitive, excluding current department)
    if (dto.name) {
      const trimmedName = dto.name.trim();
      const existing = await this.departmentRepo
        .createQueryBuilder('department')
        .where('LOWER(department.name) = LOWER(:name)', { name: trimmedName })
        .andWhere('department.id != :id', { id })
        .getOne();
      if (existing) {
        throw new ConflictException(
          `Department with name '${trimmedName}' already exists`,
        );
      }
      dto.name = trimmedName;
    }
    Object.assign(department, dto);
    return this.departmentRepo.save(department);
  }
}
