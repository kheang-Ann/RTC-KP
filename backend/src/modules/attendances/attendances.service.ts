import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Attendance,
  AttendanceStatus,
  CheckInMethod,
} from './entities/attendance.entity';
import { Session, SessionStatus } from '../sessions/entities/session.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Course } from '../courses/entities/course.entity';
import { CheckInDto } from './dto/checkin-attendance.dto';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { BulkMarkAttendanceDto } from './dto/bulk-mark-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

@Injectable()
export class AttendancesService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepo: Repository<Attendance>,
    @InjectRepository(Session)
    private sessionRepo: Repository<Session>,
    @InjectRepository(Enrollment)
    private enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Course)
    private courseRepo: Repository<Course>,
  ) {}

  async checkIn(dto: CheckInDto, studentId: number): Promise<Attendance> {
    const session = await this.sessionRepo.findOne({
      where: { attendanceCode: dto.code.toUpperCase() },
      relations: ['course'],
    });

    if (!session) {
      throw new NotFoundException('Invalid attendance code');
    }

    if (!session.isCodeActive) {
      throw new BadRequestException('Attendance code is no longer active');
    }

    if (session.status !== SessionStatus.ACTIVE) {
      throw new BadRequestException('Session is not currently active');
    }

    // Check if student is enrolled in the course
    const enrollment = await this.enrollmentRepo.findOne({
      where: {
        studentId,
        courseId: session.courseId,
      },
    });

    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled in this course');
    }

    // Check if already checked in
    const existing = await this.attendanceRepo.findOne({
      where: {
        sessionId: session.id,
        studentId,
      },
    });

    if (existing) {
      throw new ConflictException(
        'You have already checked in to this session',
      );
    }

    // Determine if late (if current time > startTime + 15 minutes)
    const now = new Date();
    const lateThreshold = new Date(session.startTime);
    lateThreshold.setMinutes(lateThreshold.getMinutes() + 15);

    const status =
      now > lateThreshold ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

    const attendance = this.attendanceRepo.create({
      sessionId: session.id,
      studentId,
      status,
      checkInMethod: CheckInMethod.CODE,
      checkInTime: now,
    });

    return this.attendanceRepo.save(attendance);
  }

  async markAttendance(
    dto: MarkAttendanceDto,
    markedById: number,
    isAdmin: boolean = false,
  ): Promise<Attendance> {
    const session = await this.sessionRepo.findOne({
      where: { id: dto.sessionId },
      relations: ['course'],
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Check if teacher owns this course (unless admin)
    if (!isAdmin && session.course?.teacherId !== markedById) {
      throw new ForbiddenException(
        'You can only mark attendance for your own courses',
      );
    }

    // Check if attendance already exists
    let attendance = await this.attendanceRepo.findOne({
      where: {
        sessionId: dto.sessionId,
        studentId: dto.studentId,
      },
    });

    if (attendance) {
      // Update existing
      attendance.status = dto.status;
      attendance.markedById = markedById;
      attendance.remarks = dto.remarks ?? attendance.remarks;
      attendance.checkInMethod = CheckInMethod.MANUAL;
    } else {
      // Create new
      attendance = this.attendanceRepo.create({
        sessionId: dto.sessionId,
        studentId: dto.studentId,
        status: dto.status,
        checkInMethod: CheckInMethod.MANUAL,
        checkInTime: new Date(),
        markedById,
        remarks: dto.remarks,
      });
    }

    return this.attendanceRepo.save(attendance);
  }

  async bulkMarkAttendance(
    dto: BulkMarkAttendanceDto,
    markedById: number,
    isAdmin: boolean = false,
  ): Promise<Attendance[]> {
    const session = await this.sessionRepo.findOne({
      where: { id: dto.sessionId },
      relations: ['course'],
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Check if teacher owns this course (unless admin)
    if (!isAdmin && session.course?.teacherId !== markedById) {
      throw new ForbiddenException(
        'You can only mark attendance for your own courses',
      );
    }

    const results: Attendance[] = [];

    for (const item of dto.attendances) {
      let attendance = await this.attendanceRepo.findOne({
        where: {
          sessionId: dto.sessionId,
          studentId: item.studentId,
        },
      });

      if (attendance) {
        attendance.status = item.status;
        attendance.markedById = markedById;
        attendance.remarks = item.remarks ?? attendance.remarks;
        attendance.checkInMethod = CheckInMethod.MANUAL;
      } else {
        attendance = this.attendanceRepo.create({
          sessionId: dto.sessionId,
          studentId: item.studentId,
          status: item.status,
          checkInMethod: CheckInMethod.MANUAL,
          checkInTime: new Date(),
          markedById,
          remarks: item.remarks,
        });
      }

      results.push(await this.attendanceRepo.save(attendance));
    }

    return results;
  }

  async findBySession(sessionId: string): Promise<Attendance[]> {
    return this.attendanceRepo.find({
      where: { sessionId },
      relations: ['student', 'markedBy'],
      order: { createdAt: 'ASC' },
    });
  }

  async findByStudent(studentId: number): Promise<Attendance[]> {
    return this.attendanceRepo.find({
      where: { studentId },
      relations: ['session', 'session.course'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByStudentAndCourse(
    studentId: number,
    courseId: string,
  ): Promise<Attendance[]> {
    return this.attendanceRepo
      .createQueryBuilder('attendance')
      .innerJoinAndSelect('attendance.session', 'session')
      .innerJoinAndSelect('session.course', 'course')
      .where('attendance.studentId = :studentId', { studentId })
      .andWhere('session.courseId = :courseId', { courseId })
      .orderBy('session.startTime', 'DESC')
      .getMany();
  }

  async update(id: string, dto: UpdateAttendanceDto): Promise<Attendance> {
    const attendance = await this.attendanceRepo.findOne({
      where: { id },
    });

    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }

    Object.assign(attendance, dto);
    return this.attendanceRepo.save(attendance);
  }

  async remove(id: string): Promise<void> {
    const result = await this.attendanceRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Attendance record not found');
    }
  }

  async getSessionSummary(sessionId: string): Promise<{
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
  }> {
    const attendances = await this.findBySession(sessionId);

    return {
      total: attendances.length,
      present: attendances.filter((a) => a.status === AttendanceStatus.PRESENT)
        .length,
      absent: attendances.filter((a) => a.status === AttendanceStatus.ABSENT)
        .length,
      late: attendances.filter((a) => a.status === AttendanceStatus.LATE)
        .length,
      excused: attendances.filter((a) => a.status === AttendanceStatus.EXCUSED)
        .length,
    };
  }
}
