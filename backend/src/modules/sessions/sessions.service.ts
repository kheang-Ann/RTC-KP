/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session, SessionStatus } from './entities/session.entity';
import { CreateSessionDto } from './dto/create-session.to';
import { UpdateSessionDto } from './dto/update-session.dto';
import { Course } from '../courses/entities/course.entity';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private sessionRepo: Repository<Session>,
    @InjectRepository(Course)
    private courseRepo: Repository<Course>,
  ) {}

  async create(dto: CreateSessionDto, userId: number): Promise<Session> {
    // Verify the course exists and user is the teacher
    const course = await this.courseRepo.findOne({
      where: { id: dto.courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.teacherId !== userId) {
      throw new ForbiddenException(
        'Only the course teacher can create sessions',
      );
    }

    const session = this.sessionRepo.create({
      ...dto,
      createdById: userId,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
    });

    return this.sessionRepo.save(session);
  }

  async findAll(userId: number, isAdmin: boolean): Promise<Session[]> {
    if (isAdmin) {
      return this.sessionRepo.find({
        relations: ['course', 'createdBy'],
        order: { startTime: 'DESC' },
      });
    }

    // For teachers, only return their sessions
    return this.sessionRepo.find({
      where: { createdById: userId },
      relations: ['course', 'createdBy'],
      order: { startTime: 'DESC' },
    });
  }

  async findByCourse(courseId: string): Promise<Session[]> {
    return this.sessionRepo.find({
      where: { courseId },
      relations: ['course', 'createdBy'],
      order: { startTime: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Session> {
    const session = await this.sessionRepo.findOne({
      where: { id },
      relations: ['course', 'createdBy', 'attendances', 'attendances.student'],
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }

  async findByCode(code: string): Promise<Session> {
    const session = await this.sessionRepo.findOne({
      where: { attendanceCode: code.toUpperCase() },
      relations: ['course'],
    });

    if (!session) {
      throw new NotFoundException('Invalid attendance code');
    }

    return session;
  }

  async update(
    id: string,
    dto: UpdateSessionDto,
    userId: number,
    isAdmin: boolean,
  ): Promise<Session> {
    const session = await this.findOne(id);

    if (!isAdmin && session.createdById !== userId) {
      throw new ForbiddenException(
        'Only the session creator or admin can update this session',
      );
    }

    Object.assign(session, {
      ...dto,
      startTime: dto.startTime ? new Date(dto.startTime) : session.startTime,
      endTime: dto.endTime ? new Date(dto.endTime) : session.endTime,
    });

    return this.sessionRepo.save(session);
  }

  async activateSession(
    id: string,
    userId: number,
    isAdmin: boolean,
  ): Promise<Session> {
    const session = await this.findOne(id);

    if (!isAdmin && session.createdById !== userId) {
      throw new ForbiddenException('Unauthorized');
    }

    session.status = SessionStatus.ACTIVE;
    session.isCodeActive = true;
    return this.sessionRepo.save(session);
  }

  async completeSession(
    id: string,
    userId: number,
    isAdmin: boolean,
  ): Promise<Session> {
    const session = await this.findOne(id);

    if (!isAdmin && session.createdById !== userId) {
      throw new ForbiddenException('Unauthorized');
    }

    session.status = SessionStatus.COMPLETED;
    session.isCodeActive = false;
    return this.sessionRepo.save(session);
  }

  async regenerateCode(
    id: string,
    userId: number,
    isAdmin: boolean,
  ): Promise<Session> {
    const session = await this.findOne(id);

    if (!isAdmin && session.createdById !== userId) {
      throw new ForbiddenException('Unauthorized');
    }

    // Generate new code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    session.attendanceCode = code;

    return this.sessionRepo.save(session);
  }

  async remove(id: string, userId: number, isAdmin: boolean): Promise<void> {
    const session = await this.findOne(id);

    if (!isAdmin && session.createdById !== userId) {
      throw new ForbiddenException('Unauthorized');
    }

    await this.sessionRepo.delete(id);
  }
}
