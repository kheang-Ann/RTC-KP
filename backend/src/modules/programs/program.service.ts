import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    // Check for duplicate name (case-insensitive)
    const trimmedName = dto.name.trim();
    const existing = await this.programRepo
      .createQueryBuilder('program')
      .where('LOWER(program.name) = LOWER(:name)', { name: trimmedName })
      .getOne();
    if (existing) {
      throw new ConflictException(
        `Program with name '${trimmedName}' already exists`,
      );
    }
    const program = this.programRepo.create({ ...dto, name: trimmedName });
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
    // Check for duplicate name (case-insensitive, excluding current program)
    if (dto.name) {
      const trimmedName = dto.name.trim();
      const existing = await this.programRepo
        .createQueryBuilder('program')
        .where('LOWER(program.name) = LOWER(:name)', { name: trimmedName })
        .andWhere('program.id != :id', { id })
        .getOne();
      if (existing) {
        throw new ConflictException(
          `Program with name '${trimmedName}' already exists`,
        );
      }
      dto.name = trimmedName;
    }

    // Update program properties
    if (dto.name !== undefined) program.name = dto.name;
    if (dto.duration !== undefined) program.duration = dto.duration;
    if (dto.degreeType !== undefined) program.degreeType = dto.degreeType;
    if (dto.departmentId !== undefined) {
      program.departmentId = dto.departmentId;
      // Clear the relation so TypeORM uses departmentId
      delete (program as Partial<Program>).department;
    }

    const savedProgram = await this.programRepo.save(program);
    // Reload with relation to return updated department
    return this.findOne(savedProgram.id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.programRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Program with ID ${id} not found`);
    }
  }
}
