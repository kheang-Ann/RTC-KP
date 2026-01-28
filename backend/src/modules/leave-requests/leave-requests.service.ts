import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  LeaveRequest,
  LeaveRequestStatus,
} from './entities/leave-request.entity';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { ReviewLeaveRequestDto } from './dto/review-leave-request.dto';
import { Course } from '../courses/entities/course.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Attendance } from '../attendances/entities/attendance.entity';
import { AttendanceStatus } from '../attendances/entities/attendance.entity';

@Injectable()
export class LeaveRequestsService {
  constructor(
    @InjectRepository(LeaveRequest)
    private leaveRequestRepo: Repository<LeaveRequest>,
    @InjectRepository(Course)
    private courseRepo: Repository<Course>,
    @InjectRepository(Enrollment)
    private enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Attendance)
    private attendanceRepo: Repository<Attendance>,
  ) {}

  async create(
    dto: CreateLeaveRequestDto,
    studentId: number,
  ): Promise<LeaveRequest> {
    // Check if student is enrolled in the course
    const enrollment = await this.enrollmentRepo.findOne({
      where: { studentId, courseId: dto.courseId },
    });

    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled in this course');
    }

    // Check for duplicate leave request
    const existing = await this.leaveRequestRepo.findOne({
      where: {
        studentId,
        courseId: dto.courseId,
        leaveDate: new Date(dto.leaveDate),
      },
    });

    if (existing) {
      throw new BadRequestException(
        'You already have a leave request for this date',
      );
    }

    const leaveRequest = this.leaveRequestRepo.create({
      studentId,
      courseId: dto.courseId,
      sessionId: dto.sessionId || null,
      leaveDate: new Date(dto.leaveDate),
      reason: dto.reason,
      status: LeaveRequestStatus.PENDING,
    });

    return this.leaveRequestRepo.save(leaveRequest);
  }

  async findAll(): Promise<LeaveRequest[]> {
    return this.leaveRequestRepo.find({
      relations: ['student', 'course', 'session', 'reviewedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByStudent(studentId: number): Promise<LeaveRequest[]> {
    return this.leaveRequestRepo.find({
      where: { studentId },
      relations: ['course', 'session', 'reviewedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByTeacher(teacherId: number): Promise<LeaveRequest[]> {
    // Get courses taught by this teacher
    const courses = await this.courseRepo.find({
      where: { teacherId },
      select: ['id'],
    });

    if (courses.length === 0) {
      return [];
    }

    const courseIds = courses.map((c) => c.id);

    return this.leaveRequestRepo
      .createQueryBuilder('lr')
      .leftJoinAndSelect('lr.student', 'student')
      .leftJoinAndSelect('lr.course', 'course')
      .leftJoinAndSelect('lr.session', 'session')
      .leftJoinAndSelect('lr.reviewedBy', 'reviewedBy')
      .where('lr.courseId IN (:...courseIds)', { courseIds })
      .orderBy('lr.createdAt', 'DESC')
      .getMany();
  }

  async findByCourse(courseId: string): Promise<LeaveRequest[]> {
    return this.leaveRequestRepo.find({
      where: { courseId },
      relations: ['student', 'session', 'reviewedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<LeaveRequest> {
    const leaveRequest = await this.leaveRequestRepo.findOne({
      where: { id },
      relations: ['student', 'course', 'session', 'reviewedBy'],
    });

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    return leaveRequest;
  }

  async review(
    id: string,
    dto: ReviewLeaveRequestDto,
    reviewerId: number,
    isAdmin: boolean = false,
  ): Promise<LeaveRequest> {
    const leaveRequest = await this.findOne(id);

    // Check if teacher owns the course (unless admin)
    if (!isAdmin) {
      const course = await this.courseRepo.findOne({
        where: { id: leaveRequest.courseId },
      });

      if (!course || course.teacherId !== reviewerId) {
        throw new ForbiddenException(
          'You can only review leave requests for your courses',
        );
      }
    }

    leaveRequest.status = dto.status;
    leaveRequest.reviewNote = dto.reviewNote || null;
    leaveRequest.reviewedById = reviewerId;
    leaveRequest.reviewedAt = new Date();

    const savedRequest = await this.leaveRequestRepo.save(leaveRequest);

    // If approved and there's a session, mark attendance as excused
    if (dto.status === LeaveRequestStatus.APPROVED && leaveRequest.sessionId) {
      let attendance = await this.attendanceRepo.findOne({
        where: {
          studentId: leaveRequest.studentId,
          sessionId: leaveRequest.sessionId,
        },
      });

      if (attendance) {
        attendance.status = AttendanceStatus.EXCUSED;
        attendance.remarks = `Approved leave: ${leaveRequest.reason}`;
        await this.attendanceRepo.save(attendance);
      } else {
        // Create excused attendance record
        attendance = this.attendanceRepo.create({
          studentId: leaveRequest.studentId,
          sessionId: leaveRequest.sessionId,
          status: AttendanceStatus.EXCUSED,
          remarks: `Approved leave: ${leaveRequest.reason}`,
          markedById: reviewerId,
        });
        await this.attendanceRepo.save(attendance);
      }
    }

    return savedRequest;
  }

  async remove(
    id: string,
    userId: number,
    isAdmin: boolean = false,
  ): Promise<void> {
    const leaveRequest = await this.findOne(id);

    // Only the student who created or admin can delete
    if (!isAdmin && leaveRequest.studentId !== userId) {
      throw new ForbiddenException(
        'You can only delete your own leave requests',
      );
    }

    // Cannot delete already reviewed requests (unless admin)
    if (!isAdmin && leaveRequest.status !== LeaveRequestStatus.PENDING) {
      throw new ForbiddenException('Cannot delete a reviewed leave request');
    }

    await this.leaveRequestRepo.delete(id);
  }
}
