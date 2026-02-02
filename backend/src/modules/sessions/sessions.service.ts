import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session, SessionStatus } from './entities/session.entity';
import { CreateSessionDto } from './dto/create-session.to';
import { UpdateSessionDto } from './dto/update-session.dto';
import { Course } from '../courses/entities/course.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { Student } from '../students/entities/student.entity';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private sessionRepo: Repository<Session>,
    @InjectRepository(Course)
    private courseRepo: Repository<Course>,
    @InjectRepository(Schedule)
    private scheduleRepo: Repository<Schedule>,
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
  ) {}

  async create(
    dto: CreateSessionDto,
    userId: number,
    isAdmin: boolean = false,
  ): Promise<Session> {
    // Admin should not create sessions
    if (isAdmin) {
      throw new ForbiddenException(
        'Administrators cannot create sessions. Only teachers can create sessions for their courses.',
      );
    }

    // Verify the course exists
    const course = await this.courseRepo.findOne({
      where: { id: dto.courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Only the course teacher can create sessions
    if (course.teacherId !== userId) {
      throw new ForbiddenException(
        'Only the course teacher can create sessions for this course',
      );
    }

    // Check for duplicate title in the same course
    const existingTitle = await this.sessionRepo.findOne({
      where: { courseId: dto.courseId, title: dto.title.trim() },
    });
    if (existingTitle) {
      throw new ConflictException(
        `A session with title '${dto.title}' already exists for this course`,
      );
    }

    // Check for time overlap with existing sessions in the same course
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    const overlappingSession = await this.sessionRepo
      .createQueryBuilder('session')
      .where('session.courseId = :courseId', { courseId: dto.courseId })
      .andWhere(
        '((session.startTime <= :startTime AND session.endTime > :startTime) OR ' +
          '(session.startTime < :endTime AND session.endTime >= :endTime) OR ' +
          '(session.startTime >= :startTime AND session.endTime <= :endTime))',
        { startTime, endTime },
      )
      .getOne();

    if (overlappingSession) {
      throw new ConflictException(
        `Session time overlaps with existing session '${overlappingSession.title}'`,
      );
    }

    const session = this.sessionRepo.create({
      ...dto,
      title: dto.title.trim(),
      createdById: userId,
      startTime,
      endTime,
    });

    return this.sessionRepo.save(session);
  }

  async findAll(userId: number, isAdmin: boolean): Promise<Session[]> {
    // Auto-close any expired sessions before returning
    await this.closeExpiredSessions();

    if (isAdmin) {
      return this.sessionRepo.find({
        relations: ['course', 'createdBy'],
        order: { startTime: 'DESC' },
      });
    }

    // For teachers, return sessions for courses they teach
    const teacherCourses = await this.courseRepo.find({
      where: { teacherId: userId },
      select: ['id'],
    });

    if (teacherCourses.length === 0) {
      return [];
    }

    const courseIds = teacherCourses.map((c) => c.id);

    return this.sessionRepo
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.course', 'course')
      .leftJoinAndSelect('session.createdBy', 'createdBy')
      .where('session.courseId IN (:...courseIds)', { courseIds })
      .orderBy('session.startTime', 'DESC')
      .getMany();
  }

  async findByCourse(courseId: string): Promise<Session[]> {
    // Auto-close any expired sessions before returning
    await this.closeExpiredSessions();

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

    const startTime = dto.startTime
      ? new Date(dto.startTime)
      : session.startTime;
    const endTime = dto.endTime ? new Date(dto.endTime) : session.endTime;

    // Check for duplicate title in the same course (excluding current session)
    if (dto.title) {
      const existingTitle = await this.sessionRepo.findOne({
        where: { courseId: session.courseId, title: dto.title.trim() },
      });
      if (existingTitle && existingTitle.id !== id) {
        throw new ConflictException(
          `A session with title '${dto.title}' already exists for this course`,
        );
      }
    }

    // Check for time overlap with existing sessions in the same course (excluding current session)
    if (dto.startTime || dto.endTime) {
      const overlappingSession = await this.sessionRepo
        .createQueryBuilder('session')
        .where('session.courseId = :courseId', { courseId: session.courseId })
        .andWhere('session.id != :id', { id })
        .andWhere(
          '((session.startTime <= :startTime AND session.endTime > :startTime) OR ' +
            '(session.startTime < :endTime AND session.endTime >= :endTime) OR ' +
            '(session.startTime >= :startTime AND session.endTime <= :endTime))',
          { startTime, endTime },
        )
        .getOne();

      if (overlappingSession) {
        throw new ConflictException(
          `Session time overlaps with existing session '${overlappingSession.title}'`,
        );
      }
    }

    Object.assign(session, {
      ...dto,
      title: dto.title ? dto.title.trim() : session.title,
      startTime,
      endTime,
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

    // Check if current time is within session start and end time
    const now = new Date();
    const startTime = new Date(session.startTime);
    const endTime = new Date(session.endTime);

    if (now < startTime || now > endTime) {
      // Format times in Cambodia timezone for clarity
      const formatTime = (d: Date) =>
        d.toLocaleString('en-GB', {
          timeZone: 'Asia/Phnom_Penh',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
      throw new BadRequestException(
        `Cannot activate session outside of scheduled time. Session is scheduled from ${formatTime(startTime)} to ${formatTime(endTime)}. Current time: ${formatTime(now)}`,
      );
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

  // Auto-close expired sessions (can be called from a controller endpoint or scheduled task)
  async closeExpiredSessions(): Promise<number> {
    const now = new Date();
    const result = await this.sessionRepo
      .createQueryBuilder()
      .update(Session)
      .set({
        status: SessionStatus.COMPLETED,
        isCodeActive: false,
      })
      .where('status = :status', { status: SessionStatus.ACTIVE })
      .andWhere('endTime < :now', { now })
      .execute();

    return result.affected || 0;
  }

  // Get upcoming and active sessions for a student based on their enrolled courses
  async findUpcomingForStudent(userId: number): Promise<Session[]> {
    // Auto-close any expired sessions before returning
    await this.closeExpiredSessions();

    // First, find the student by userId to get their groupId
    const student = await this.studentRepo.findOne({
      where: { userId },
    });

    if (!student || !student.groupId) {
      return [];
    }

    // Find all courses scheduled for this student's group
    const schedules = await this.scheduleRepo.find({
      where: { groupId: student.groupId, isActive: true },
      select: ['courseId'],
    });

    if (schedules.length === 0) {
      return [];
    }

    const courseIds = [...new Set(schedules.map((s) => s.courseId))];

    // Find all upcoming and active sessions for these courses
    const now = new Date();
    return this.sessionRepo
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.course', 'course')
      .leftJoinAndSelect('course.teacher', 'teacher')
      .leftJoinAndSelect('session.createdBy', 'createdBy')
      .where('session.courseId IN (:...courseIds)', { courseIds })
      .andWhere(
        '(session.status = :active OR (session.status = :scheduled AND session.endTime > :now))',
        {
          active: SessionStatus.ACTIVE,
          scheduled: SessionStatus.SCHEDULED,
          now,
        },
      )
      .orderBy('session.startTime', 'ASC')
      .getMany();
  }
}
