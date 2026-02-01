import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { Group } from './entities/group.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { Student } from '../students/entities/student.entity';
import { Program } from '../programs/entities/program.entity';
import { Schedule } from '../schedules/entities/schedule.entity';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private groupRepo: Repository<Group>,
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(Program)
    private programRepo: Repository<Program>,
    @InjectRepository(Schedule)
    private scheduleRepo: Repository<Schedule>,
  ) {}

  async findAll(): Promise<Group[]> {
    return this.groupRepo.find({
      relations: ['program', 'program.department', 'students'],
      order: { programId: 'ASC', academicYear: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Group> {
    const group = await this.groupRepo.findOne({
      where: { id },
      relations: ['program', 'program.department', 'students'],
    });
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  async findByProgram(programId: number): Promise<Group[]> {
    return this.groupRepo.find({
      where: { programId },
      relations: ['program', 'students'],
      order: { academicYear: 'ASC', name: 'ASC' },
    });
  }

  async findByProgramAndYear(
    programId: number,
    academicYear: number,
  ): Promise<Group[]> {
    return this.groupRepo.find({
      where: { programId, academicYear },
      relations: ['program', 'students'],
      order: { name: 'ASC' },
    });
  }

  async create(dto: CreateGroupDto): Promise<Group> {
    // Validate program exists and academic year is within program duration
    const program = await this.programRepo.findOne({
      where: { id: dto.programId },
    });
    if (!program) {
      throw new NotFoundException('Program not found');
    }
    if (dto.academicYear > program.duration) {
      throw new BadRequestException(
        `Academic year ${dto.academicYear} exceeds program duration of ${program.duration} years`,
      );
    }

    // Check for duplicate group
    const existing = await this.groupRepo.findOne({
      where: {
        programId: dto.programId,
        academicYear: dto.academicYear,
        name: dto.name.trim(),
      },
    });
    if (existing) {
      throw new ConflictException(
        `Group '${dto.name}' already exists for this program and year`,
      );
    }

    const group = this.groupRepo.create({
      ...dto,
      name: dto.name.trim(),
    });
    return this.groupRepo.save(group);
  }

  async update(id: number, dto: UpdateGroupDto): Promise<Group> {
    const group = await this.groupRepo.findOne({
      where: { id },
      relations: ['program'],
    });
    if (!group) throw new NotFoundException('Group not found');

    // Validate academic year if updating
    if (dto.academicYear) {
      const program = dto.programId
        ? await this.programRepo.findOne({ where: { id: dto.programId } })
        : group.program;
      if (program && dto.academicYear > program.duration) {
        throw new BadRequestException(
          `Academic year ${dto.academicYear} exceeds program duration of ${program.duration} years`,
        );
      }
    }

    // Check if academic year is changing
    const academicYearChanged =
      dto.academicYear && dto.academicYear !== group.academicYear;

    Object.assign(group, dto);
    if (dto.name) group.name = dto.name.trim();
    const savedGroup = await this.groupRepo.save(group);

    // Update all students in this group to the new academic year
    if (academicYearChanged) {
      await this.studentRepo.update(
        { groupId: id },
        { academicYear: dto.academicYear },
      );
    }

    return savedGroup;
  }

  async remove(id: number): Promise<void> {
    const group = await this.groupRepo.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Check for related students
    const studentsCount = await this.studentRepo.count({
      where: { groupId: id },
    });
    if (studentsCount > 0) {
      throw new BadRequestException(
        `Cannot delete group. Please remove ${studentsCount} student(s) from this group first.`,
      );
    }

    // Check for related schedules
    const schedulesCount = await this.scheduleRepo.count({
      where: { groupId: id },
    });
    if (schedulesCount > 0) {
      throw new BadRequestException(
        `Cannot delete group. Please remove ${schedulesCount} schedule(s) first.`,
      );
    }

    await this.groupRepo.delete(id);
  }

  async addStudentsToGroup(
    groupId: number,
    studentIds: number[],
  ): Promise<Group> {
    const group = await this.groupRepo.findOne({
      where: { id: groupId },
      relations: ['students'],
    });
    if (!group) throw new NotFoundException('Group not found');

    // Check capacity
    const currentCount = group.students.length;
    const newCount = studentIds.length;
    if (currentCount + newCount > group.maxCapacity) {
      throw new BadRequestException(
        `Cannot add ${newCount} students. Group capacity is ${group.maxCapacity}, current count is ${currentCount}`,
      );
    }

    // Update students' groupId
    await this.studentRepo.update({ id: In(studentIds) }, { groupId: groupId });

    return this.findOne(groupId);
  }

  async removeStudentFromGroup(
    groupId: number,
    studentId: number,
  ): Promise<Group> {
    const student = await this.studentRepo.findOne({
      where: { id: studentId, groupId: groupId },
    });
    if (!student) {
      throw new NotFoundException('Student not found in this group');
    }

    student.groupId = null;
    await this.studentRepo.save(student);

    return this.findOne(groupId);
  }

  async getStudentsInGroup(groupId: number): Promise<Student[]> {
    return this.studentRepo.find({
      where: { groupId },
      relations: ['user', 'program', 'department'],
      order: { nameLatin: 'ASC' },
    });
  }

  async getAvailableStudents(
    programId: number,
    academicYear: number,
  ): Promise<Student[]> {
    // Get students without a group that match the program and year
    return this.studentRepo.find({
      where: {
        programId,
        academicYear,
        groupId: IsNull(),
      },
      relations: ['user', 'program'],
      order: { nameLatin: 'ASC' },
    });
  }
}
