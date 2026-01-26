import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment } from './entities/enrollment.entity';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';

@Injectable()
export class EnrollmentService {
  constructor(
    @InjectRepository(Enrollment)
    private enrollmentRepo: Repository<Enrollment>,
  ) {}

  async findAll(): Promise<Enrollment[]> {
    return this.enrollmentRepo.find({
      relations: ['student', 'course'],
    });
  }

  async findOne(id: string): Promise<Enrollment> {
    const enrollment = await this.enrollmentRepo.findOne({
      where: { id },
      relations: ['student', 'course'],
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    return enrollment;
  }

  async findByStudent(studentId: number): Promise<Enrollment[]> {
    return this.enrollmentRepo.find({
      where: { studentId },
      relations: ['course'],
      select: {
        course: { id: true, name: true },
      },
    });
  }

  async findByCourse(courseId: string): Promise<Enrollment[]> {
    return this.enrollmentRepo.find({
      where: { courseId },
      relations: ['student'],
      select: {
        student: { id: true, email: true },
      },
    });
  }

  async create(dto: CreateEnrollmentDto): Promise<Enrollment> {
    const existing = await this.enrollmentRepo.findOne({
      where: { studentId: dto.studentId, courseId: dto.courseId },
    });
    if (existing) {
      throw new ConflictException('Student is already enrolled in this course');
    }

    const enrollment = this.enrollmentRepo.create({
      ...dto,
      enrolledAt: dto.enrolledAt ? new Date(dto.enrolledAt) : new Date(),
    });
    return this.enrollmentRepo.save(enrollment);
  }

  async update(id: string, dto: UpdateEnrollmentDto): Promise<Enrollment> {
    const enrollment = await this.enrollmentRepo.preload({
      id,
      ...dto,
      enrolledAt: dto.enrolledAt ? new Date(dto.enrolledAt) : undefined,
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    return this.enrollmentRepo.save(enrollment);
  }

  async remove(id: string): Promise<void> {
    const res = await this.enrollmentRepo.delete(id);
    if (res.affected === 0) throw new NotFoundException('Enrollment not found');
  }
}
