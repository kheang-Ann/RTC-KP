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
    // Check for duplicate name
    if (dto.name) {
      const existing = await this.departmentRepo.findOne({
        where: { name: dto.name.trim() },
      });
      if (existing) {
        throw new ConflictException(
          `Department with name '${dto.name}' already exists`,
        );
      }
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
    // Check for duplicate name (excluding current department)
    if (dto.name) {
      const existing = await this.departmentRepo.findOne({
        where: { name: dto.name.trim(), id: Not(id) },
      });
      if (existing) {
        throw new ConflictException(
          `Department with name '${dto.name}' already exists`,
        );
      }
    }
    Object.assign(department, dto);
    return this.departmentRepo.save(department);
  }
}
