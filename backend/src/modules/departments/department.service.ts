import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Department } from './entity/department.entity';
import { Repository, Not } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class DepartmentService {
  @InjectRepository(Department)
  private departmentRepo: Repository<Department>;

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
