import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import {
  LeaveRequest,
  LeaveRequestStatus,
  RequesterType,
} from './entities/leave-request.entity';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { ReviewLeaveRequestDto } from './dto/review-leave-request.dto';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Session } from '../sessions/entities/session.entity';
import {
  Attendance,
  AttendanceStatus,
  CheckInMethod,
} from '../attendances/entities/attendance.entity';
import { Schedule } from '../schedules/entities/schedule.entity';

@Injectable()
export class LeaveRequestsService {
  constructor(
    @InjectRepository(LeaveRequest)
    private leaveRequestRepo: Repository<LeaveRequest>,
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(Teacher)
    private teacherRepo: Repository<Teacher>,
    @InjectRepository(Session)
    private sessionRepo: Repository<Session>,
    @InjectRepository(Attendance)
    private attendanceRepo: Repository<Attendance>,
    @InjectRepository(Schedule)
    private scheduleRepo: Repository<Schedule>,
  ) {}

  private calculateTotalDays(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }

  async create(
    dto: CreateLeaveRequestDto,
    userId: number,
    requesterType: RequesterType,
    documentPath?: string,
  ): Promise<LeaveRequest> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    // Validate dates
    if (endDate < startDate) {
      throw new BadRequestException('End date cannot be before start date');
    }

    const totalDays = this.calculateTotalDays(startDate, endDate);

    let studentId: number | null = null;
    let teacherId: number | null = null;

    // Find student or teacher based on requester type
    if (requesterType === RequesterType.STUDENT) {
      const student = await this.studentRepo.findOne({
        where: { userId },
      });
      if (!student) {
        throw new NotFoundException('Student profile not found');
      }
      studentId = student.id;
    } else if (requesterType === RequesterType.TEACHER) {
      const teacher = await this.teacherRepo.findOne({
        where: { userId },
      });
      if (!teacher) {
        throw new NotFoundException('Teacher profile not found');
      }
      teacherId = teacher.id;
    }

    // Check for overlapping leave requests
    const overlapping = await this.leaveRequestRepo
      .createQueryBuilder('lr')
      .where('lr.userId = :userId', { userId })
      .andWhere('lr.status != :rejected', {
        rejected: LeaveRequestStatus.REJECTED,
      })
      .andWhere('(lr.startDate <= :endDate AND lr.endDate >= :startDate)', {
        startDate: dto.startDate,
        endDate: dto.endDate,
      })
      .getOne();

    if (overlapping) {
      throw new BadRequestException(
        'You already have a leave request for overlapping dates',
      );
    }

    const leaveRequest = this.leaveRequestRepo.create({
      userId,
      requesterType,
      studentId,
      teacherId,
      leaveType: dto.leaveType,
      startDate,
      endDate,
      totalDays,
      reason: dto.reason,
      documentPath: documentPath || null,
      status: LeaveRequestStatus.PENDING,
    });

    return this.leaveRequestRepo.save(leaveRequest);
  }

  async findAll(): Promise<LeaveRequest[]> {
    return this.leaveRequestRepo.find({
      relations: ['user', 'student', 'teacher', 'reviewedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(userId: number): Promise<LeaveRequest[]> {
    return this.leaveRequestRepo.find({
      where: { userId },
      relations: ['reviewedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<LeaveRequest> {
    const leaveRequest = await this.leaveRequestRepo.findOne({
      where: { id },
      relations: ['user', 'student', 'teacher', 'reviewedBy'],
    });

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    return leaveRequest;
  }

  async findOneWithDetails(id: string): Promise<{
    leaveRequest: LeaveRequest;
    contactDetails: {
      name: string;
      nameKhmer: string;
      email: string;
      phoneNumbers: string[];
      emergencyPhoneNumbers?: string[];
      department?: string;
      program?: string;
      type: string;
    };
  }> {
    const leaveRequest = await this.leaveRequestRepo.findOne({
      where: { id },
      relations: [
        'user',
        'student',
        'student.department',
        'student.program',
        'teacher',
        'teacher.department',
        'reviewedBy',
      ],
    });

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    let contactDetails: {
      name: string;
      nameKhmer: string;
      email: string;
      phoneNumbers: string[];
      emergencyPhoneNumbers?: string[];
      department?: string;
      program?: string;
      type: string;
    };

    if (
      leaveRequest.requesterType === RequesterType.STUDENT &&
      leaveRequest.student
    ) {
      contactDetails = {
        name: leaveRequest.student.nameLatin,
        nameKhmer: leaveRequest.student.nameKhmer,
        email: leaveRequest.student.personalEmail,
        phoneNumbers: leaveRequest.student.phoneNumbers,
        emergencyPhoneNumbers: leaveRequest.student.emergencyPhoneNumbers,
        department: leaveRequest.student.department?.name,
        program: leaveRequest.student.program?.name,
        type: 'Student',
      };
    } else if (
      leaveRequest.requesterType === RequesterType.TEACHER &&
      leaveRequest.teacher
    ) {
      contactDetails = {
        name: leaveRequest.teacher.nameLatin,
        nameKhmer: leaveRequest.teacher.nameKhmer,
        email: leaveRequest.teacher.personalEmail,
        phoneNumbers: leaveRequest.teacher.phoneNumbers,
        department: leaveRequest.teacher.department?.name,
        type: 'Teacher',
      };
    } else {
      contactDetails = {
        name: leaveRequest.user?.nameLatin || 'Unknown',
        nameKhmer: leaveRequest.user?.nameKhmer || 'Unknown',
        email: leaveRequest.user?.email || 'Unknown',
        phoneNumbers: [],
        type: leaveRequest.requesterType,
      };
    }

    return { leaveRequest, contactDetails };
  }

  async review(
    id: string,
    dto: ReviewLeaveRequestDto,
    reviewerId: number,
  ): Promise<LeaveRequest> {
    const leaveRequest = await this.findOne(id);

    if (leaveRequest.status !== LeaveRequestStatus.PENDING) {
      throw new BadRequestException(
        'This leave request has already been reviewed',
      );
    }

    leaveRequest.status = dto.status;
    leaveRequest.reviewNote = dto.reviewNote || null;
    leaveRequest.reviewedById = reviewerId;
    leaveRequest.reviewedAt = new Date();

    const savedLeaveRequest = await this.leaveRequestRepo.save(leaveRequest);

    // If approved and it's a student leave request, auto-record excused attendance
    if (
      dto.status === LeaveRequestStatus.APPROVED &&
      leaveRequest.requesterType === RequesterType.STUDENT &&
      leaveRequest.studentId
    ) {
      await this.autoRecordExcusedAttendance(leaveRequest);
    }

    return savedLeaveRequest;
  }

  /**
   * Auto-record excused attendance for all sessions that fall within the approved leave period
   */
  private async autoRecordExcusedAttendance(
    leaveRequest: LeaveRequest,
  ): Promise<void> {
    if (!leaveRequest.studentId) return;

    // Get the student to find their group
    const student = await this.studentRepo.findOne({
      where: { id: leaveRequest.studentId },
    });

    if (!student || !student.groupId) return;

    // Get all schedules for this student's group
    const schedules = await this.scheduleRepo.find({
      where: { groupId: student.groupId, isActive: true },
    });

    if (schedules.length === 0) return;

    const courseIds = schedules.map((s) => s.courseId);

    // Find all sessions within the leave period for courses the student is enrolled in
    const startDate = new Date(leaveRequest.startDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(leaveRequest.endDate);
    endDate.setHours(23, 59, 59, 999);

    const sessions = await this.sessionRepo
      .createQueryBuilder('session')
      .where('session.courseId IN (:...courseIds)', { courseIds })
      .andWhere('session.startTime >= :startDate', { startDate })
      .andWhere('session.startTime <= :endDate', { endDate })
      .getMany();

    // Create or update attendance records as excused for each session
    for (const session of sessions) {
      const existingAttendance = await this.attendanceRepo.findOne({
        where: {
          sessionId: session.id,
          studentId: student.userId,
        },
      });

      if (existingAttendance) {
        // Update existing attendance to excused
        existingAttendance.status = AttendanceStatus.EXCUSED;
        existingAttendance.remarks = `Leave approved: ${leaveRequest.leaveType}`;
        await this.attendanceRepo.save(existingAttendance);
      } else {
        // Create new excused attendance
        const attendance = this.attendanceRepo.create({
          sessionId: session.id,
          studentId: student.userId,
          status: AttendanceStatus.EXCUSED,
          checkInMethod: CheckInMethod.MANUAL,
          checkInTime: session.startTime,
          remarks: `Leave approved: ${leaveRequest.leaveType}`,
        });
        await this.attendanceRepo.save(attendance);
      }
    }
  }

  async remove(
    id: string,
    userId: number,
    isAdmin: boolean = false,
  ): Promise<void> {
    const leaveRequest = await this.findOne(id);

    // Only the user who created or admin can delete
    if (!isAdmin && leaveRequest.userId !== userId) {
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
