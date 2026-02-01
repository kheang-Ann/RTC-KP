import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Course } from './entities/course.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { Session } from '../sessions/entities/session.entity';
@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(Course)
    private courseRepo: Repository<Course>,
    @InjectRepository(Schedule)
    private scheduleRepo: Repository<Schedule>,
    @InjectRepository(Session)
    private sessionRepo: Repository<Session>,
  ) {}

  async findAll(): Promise<Course[]> {
    return this.courseRepo.find({
      relations: ['department', 'teacher'],
    });
  }

  async findByTeacher(teacherId: number): Promise<Course[]> {
    return this.courseRepo.find({
      where: { teacherId },
      relations: ['department', 'teacher'],
    });
  }

  async findOne(id: string): Promise<Course | null> {
    const course = await this.courseRepo.findOne({
      where: { id },
      relations: ['department', 'teacher'],
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async create(dto: CreateCourseDto): Promise<Course> {
    // Check for duplicate code
    const existing = await this.courseRepo.findOne({
      where: { code: dto.code.trim().toUpperCase() },
    });
    if (existing) {
      throw new ConflictException(
        `Course with code '${dto.code}' already exists`,
      );
    }
    const course = this.courseRepo.create(dto);
    return this.courseRepo.save(course);
  }

  async update(id: string, dto: UpdateCourseDto): Promise<Course> {
    const course = await this.courseRepo.preload({ id, ...dto });
    if (!course) throw new NotFoundException('Course not found');
    // Check for duplicate code (excluding current course)
    if (dto.code) {
      const existing = await this.courseRepo.findOne({
        where: { code: dto.code.trim().toUpperCase(), id: Not(id) },
      });
      if (existing) {
        throw new ConflictException(
          `Course with code '${dto.code}' already exists`,
        );
      }
    }
    return this.courseRepo.save(course);
  }

  async remove(id: string): Promise<void> {
    const course = await this.courseRepo.findOne({ where: { id } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check for related schedules
    const schedulesCount = await this.scheduleRepo.count({
      where: { courseId: id },
    });
    if (schedulesCount > 0) {
      throw new BadRequestException(
        `Cannot delete course. Please remove ${schedulesCount} schedule(s) first.`,
      );
    }

    // Check for related sessions
    const sessionsCount = await this.sessionRepo.count({
      where: { courseId: id },
    });
    if (sessionsCount > 0) {
      throw new BadRequestException(
        `Cannot delete course. Please remove ${sessionsCount} session(s) first.`,
      );
    }

    await this.courseRepo.delete(id);
  }
}
