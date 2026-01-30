import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Program } from './entities/program.entity';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';

@Injectable()
export class ProgramService {
  constructor(
    @InjectRepository(Program)
    private programRepo: Repository<Program>,
  ) {}

  async create(dto: CreateProgramDto): Promise<Program> {
    // Check for duplicate name
    const existing = await this.programRepo.findOne({
      where: { name: dto.name.trim() },
    });
    if (existing) {
      throw new ConflictException(
        `Program with name '${dto.name}' already exists`,
      );
    }
    const program = this.programRepo.create(dto);
    return this.programRepo.save(program);
  }

  async findAll(): Promise<Program[]> {
    return this.programRepo.find({
      relations: ['department'],
      order: { name: 'ASC' },
    });
  }

  async findByDepartment(departmentId: number): Promise<Program[]> {
    return this.programRepo.find({
      where: { departmentId },
      relations: ['department'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Program> {
    const program = await this.programRepo.findOne({
      where: { id },
      relations: ['department'],
    });
    if (!program) {
      throw new NotFoundException(`Program with ID ${id} not found`);
    }
    return program;
  }

  async update(id: number, dto: UpdateProgramDto): Promise<Program> {
    const program = await this.findOne(id);
    // Check for duplicate name (excluding current program)
    if (dto.name) {
      const existing = await this.programRepo.findOne({
        where: { name: dto.name.trim(), id: Not(id) },
      });
      if (existing) {
        throw new ConflictException(
          `Program with name '${dto.name}' already exists`,
        );
      }
    }
    Object.assign(program, dto);
    return this.programRepo.save(program);
  }

  async remove(id: number): Promise<void> {
    const result = await this.programRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Program with ID ${id} not found`);
    }
  }
}
