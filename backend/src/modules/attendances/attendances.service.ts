import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  Attendance,
  AttendanceStatus,
  CheckInMethod,
} from './entities/attendance.entity';
import { Session, SessionStatus } from '../sessions/entities/session.entity';
import { Course } from '../courses/entities/course.entity';
import { Student } from '../students/entities/student.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
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
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(Schedule)
    private scheduleRepo: Repository<Schedule>,
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

    // Check if student's group has this course scheduled
    const student = await this.studentRepo.findOne({
      where: { userId: studentId },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    if (!student.groupId) {
      throw new ForbiddenException('You are not assigned to a group');
    }

    const schedule = await this.scheduleRepo.findOne({
      where: {
        groupId: student.groupId,
        courseId: session.courseId,
        isActive: true,
      },
    });

    if (!schedule) {
      throw new ForbiddenException(
        'Your group does not have this course scheduled',
      );
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

    // Lookup the student to get their userId (studentId in DTO is the Student entity ID)
    const student = await this.studentRepo.findOne({
      where: { id: dto.studentId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (!student.userId) {
      throw new BadRequestException('Student does not have a user account');
    }

    const studentUserId = student.userId;

    // Check if attendance already exists
    let attendance = await this.attendanceRepo.findOne({
      where: {
        sessionId: dto.sessionId,
        studentId: studentUserId,
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
        studentId: studentUserId,
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

    // Lookup all students to get their userIds
    const studentIds = dto.attendances.map((a) => a.studentId);
    const students = await this.studentRepo.find({
      where: { id: In(studentIds) },
    });

    const studentIdToUserIdMap = new Map<number, number>();
    for (const student of students) {
      if (student.userId) {
        studentIdToUserIdMap.set(student.id, student.userId);
      }
    }

    const results: Attendance[] = [];

    for (const item of dto.attendances) {
      const studentUserId = studentIdToUserIdMap.get(item.studentId);
      if (!studentUserId) {
        // Skip students without user accounts
        continue;
      }

      let attendance = await this.attendanceRepo.findOne({
        where: {
          sessionId: dto.sessionId,
          studentId: studentUserId,
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
          studentId: studentUserId,
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

  async findByStudentUserId(userId: number): Promise<Attendance[]> {
    // The attendance.studentId field stores the userId directly
    // Just verify the student exists first
    const student = await this.studentRepo.findOne({
      where: { userId },
    });

    if (!student) {
      return [];
    }

    // Query by userId since that's what's stored in attendance.studentId
    return this.findByStudent(userId);
  }

  async findByStudentUserIdAndCourse(
    userId: number,
    courseId: string,
  ): Promise<Attendance[]> {
    // Verify the student exists
    const student = await this.studentRepo.findOne({
      where: { userId },
    });

    if (!student) {
      return [];
    }

    // Query by userId since that's what's stored in attendance.studentId
    return this.findByStudentAndCourse(userId, courseId);
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
