/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule, TimeSlot, DayOfWeek } from './entities/schedule.entity';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { Course } from '../courses/entities/course.entity';
import { Teacher } from '../teachers/entities/teacher.entity';

// Time slots ordered for validation
const TIME_SLOTS_ORDER: TimeSlot[] = [
  TimeSlot.SLOT_7_8,
  TimeSlot.SLOT_8_9,
  TimeSlot.SLOT_9_10,
  TimeSlot.SLOT_10_11,
  TimeSlot.SLOT_13_14,
  TimeSlot.SLOT_14_15,
  TimeSlot.SLOT_15_16,
  TimeSlot.SLOT_16_17,
];

// Generate a color based on course ID
function generateColor(courseId: string): string {
  const colors = [
    '#4CAF50',
    '#2196F3',
    '#FF9800',
    '#E91E63',
    '#9C27B0',
    '#00BCD4',
    '#795548',
    '#607D8B',
    '#F44336',
    '#3F51B5',
    '#009688',
    '#FFEB3B',
    '#673AB7',
    '#8BC34A',
    '#FF5722',
  ];
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < courseId.length; i++) {
    hash = (hash << 5) - hash + courseId.charCodeAt(i);
    hash = hash & hash;
  }
  return colors[Math.abs(hash) % colors.length];
}

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Schedule)
    private scheduleRepo: Repository<Schedule>,
    @InjectRepository(Course)
    private courseRepo: Repository<Course>,
    @InjectRepository(Teacher)
    private teacherRepo: Repository<Teacher>,
  ) {}

  async findAll(): Promise<Schedule[]> {
    return this.scheduleRepo.find({
      relations: ['course', 'course.teacher', 'group', 'group.program'],
      order: { dayOfWeek: 'ASC', startSlot: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Schedule> {
    const schedule = await this.scheduleRepo.findOne({
      where: { id },
      relations: ['course', 'course.teacher', 'group', 'group.program'],
    });
    if (!schedule) throw new NotFoundException('Schedule not found');
    return schedule;
  }

  async findByGroup(groupId: number, semester?: number): Promise<Schedule[]> {
    const where: any = { groupId, isActive: true };
    if (semester) {
      where.semester = semester;
    }
    return this.scheduleRepo.find({
      where,
      relations: ['course', 'course.teacher', 'group', 'group.program'],
      order: { dayOfWeek: 'ASC', startSlot: 'ASC' },
    });
  }

  async findByGroupFormatted(
    groupId: number,
    semester?: number,
  ): Promise<Record<string, Schedule[]>> {
    const schedules = await this.findByGroup(groupId, semester);

    // Group by day of week
    const result: Record<string, Schedule[]> = {};
    for (const day of Object.values(DayOfWeek)) {
      result[day] = schedules.filter((s) => s.dayOfWeek === day);
    }
    return result;
  }

  async findByCourse(courseId: string): Promise<Schedule[]> {
    return this.scheduleRepo.find({
      where: { courseId, isActive: true },
      relations: ['course', 'course.teacher', 'group', 'group.program'],
      order: { dayOfWeek: 'ASC', startSlot: 'ASC' },
    });
  }

  async findByTeacher(
    teacherId: number,
    semester?: number,
  ): Promise<Schedule[]> {
    // teacherId here is the Teacher entity's ID, but Course.teacherId references User.id
    // We need to get the teacher's userId first
    const teacher = await this.teacherRepo.findOne({
      where: { id: teacherId },
      select: ['userId'],
    });

    if (!teacher?.userId) {
      return [];
    }

    const where: any = {
      course: { teacherId: teacher.userId },
      isActive: true,
    };
    if (semester) {
      where.semester = semester;
    }
    return this.scheduleRepo.find({
      where,
      relations: ['course', 'course.teacher', 'group', 'group.program'],
      order: { dayOfWeek: 'ASC', startSlot: 'ASC' },
    });
  }

  async create(dto: CreateScheduleDto): Promise<Schedule> {
    // Validate time slot duration doesn't overflow into break or next session
    const startIndex = TIME_SLOTS_ORDER.indexOf(dto.startSlot);
    if (startIndex === -1) {
      throw new BadRequestException('Invalid start time slot');
    }

    // Check if duration would overflow across morning/afternoon break
    const morningSlots = [
      TimeSlot.SLOT_7_8,
      TimeSlot.SLOT_8_9,
      TimeSlot.SLOT_9_10,
      TimeSlot.SLOT_10_11,
    ];
    const afternoonSlots = [
      TimeSlot.SLOT_13_14,
      TimeSlot.SLOT_14_15,
      TimeSlot.SLOT_15_16,
      TimeSlot.SLOT_16_17,
    ];

    const isMorning = morningSlots.includes(dto.startSlot);
    const availableSlots = isMorning
      ? morningSlots.slice(morningSlots.indexOf(dto.startSlot))
      : afternoonSlots.slice(afternoonSlots.indexOf(dto.startSlot));

    if (dto.duration > availableSlots.length) {
      throw new BadRequestException(
        `Duration of ${dto.duration} hours exceeds available slots. Maximum ${availableSlots.length} hours available in this session.`,
      );
    }

    // Check for group conflicts (same group, same day, same semester, overlapping time)
    const groupConflict = await this.checkGroupConflict(
      dto.groupId,
      dto.semester,
      dto.dayOfWeek,
      dto.startSlot,
      dto.duration,
    );
    if (groupConflict) {
      throw new ConflictException(
        `Schedule conflict: ${groupConflict.course.name} is already scheduled for this group at this time`,
      );
    }

    // Check for teacher conflicts (same teacher, same day, same semester, overlapping time)
    const course = await this.courseRepo.findOne({
      where: { id: dto.courseId },
    });
    if (course?.teacherId) {
      const teacherConflict = await this.checkTeacherConflict(
        course.teacherId,
        dto.semester,
        dto.dayOfWeek,
        dto.startSlot,
        dto.duration,
      );
      if (teacherConflict) {
        throw new ConflictException(
          `Teacher conflict: Teacher is already scheduled for ${teacherConflict.course.name} with ${teacherConflict.group?.name || 'another group'} at this time`,
        );
      }
    }

    // Generate color if not provided
    const color = dto.color || generateColor(dto.courseId);

    const schedule = this.scheduleRepo.create({
      ...dto,
      semesterWeeks: dto.semesterWeeks || 16,
      color,
    });
    return this.scheduleRepo.save(schedule);
  }

  async update(id: number, dto: UpdateScheduleDto): Promise<Schedule> {
    const schedule = await this.scheduleRepo.findOne({
      where: { id },
      relations: ['course'],
    });
    if (!schedule) throw new NotFoundException('Schedule not found');

    const groupId = dto.groupId || schedule.groupId;
    const semester = dto.semester || schedule.semester;
    const dayOfWeek = dto.dayOfWeek || schedule.dayOfWeek;
    const startSlot = dto.startSlot || schedule.startSlot;
    const duration = dto.duration || schedule.duration;
    const courseId = dto.courseId || schedule.courseId;

    // If updating time-related fields, check for group conflicts
    if (
      dto.dayOfWeek ||
      dto.startSlot ||
      dto.duration ||
      dto.groupId ||
      dto.semester
    ) {
      const groupConflict = await this.checkGroupConflict(
        groupId,
        semester,
        dayOfWeek,
        startSlot,
        duration,
        id,
      );
      if (groupConflict) {
        throw new ConflictException(
          `Schedule conflict: ${groupConflict.course.name} is already scheduled for this group at this time`,
        );
      }
    }

    // Check for teacher conflicts
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (
      course?.teacherId &&
      (dto.dayOfWeek ||
        dto.startSlot ||
        dto.duration ||
        dto.semester ||
        dto.courseId)
    ) {
      const teacherConflict = await this.checkTeacherConflict(
        course.teacherId,
        semester,
        dayOfWeek,
        startSlot,
        duration,
        id,
      );
      if (teacherConflict) {
        throw new ConflictException(
          `Teacher conflict: Teacher is already scheduled for ${teacherConflict.course.name} at this time`,
        );
      }
    }

    // Clear relation objects to ensure FK updates work correctly
    // TypeORM uses relation objects over FK columns when both are present
    if (dto.courseId !== undefined) {
      (schedule as any).course = undefined;
    }
    if (dto.groupId !== undefined) {
      (schedule as any).group = undefined;
    }

    Object.assign(schedule, dto);
    return this.scheduleRepo.save(schedule);
  }

  async remove(id: number): Promise<void> {
    const result = await this.scheduleRepo.delete(id);
    if (result.affected === 0)
      throw new NotFoundException('Schedule not found');
  }

  private async checkGroupConflict(
    groupId: number,
    semester: number,
    dayOfWeek: DayOfWeek,
    startSlot: TimeSlot,
    duration: number,
    excludeId?: number,
  ): Promise<Schedule | null> {
    const existingSchedules = await this.scheduleRepo.find({
      where: { groupId, semester, dayOfWeek, isActive: true },
      relations: ['course'],
    });

    return this.findOverlappingSchedule(
      existingSchedules,
      startSlot,
      duration,
      excludeId,
    );
  }

  private async checkTeacherConflict(
    teacherId: number,
    semester: number,
    dayOfWeek: DayOfWeek,
    startSlot: TimeSlot,
    duration: number,
    excludeId?: number,
  ): Promise<Schedule | null> {
    const existingSchedules = await this.scheduleRepo.find({
      where: { course: { teacherId }, semester, dayOfWeek, isActive: true },
      relations: ['course', 'group'],
    });

    return this.findOverlappingSchedule(
      existingSchedules,
      startSlot,
      duration,
      excludeId,
    );
  }

  private findOverlappingSchedule(
    schedules: Schedule[],
    startSlot: TimeSlot,
    duration: number,
    excludeId?: number,
  ): Schedule | null {
    const startIndex = TIME_SLOTS_ORDER.indexOf(startSlot);
    const endIndex = startIndex + duration - 1;

    for (const existing of schedules) {
      if (excludeId && existing.id === excludeId) continue;

      const existingStart = TIME_SLOTS_ORDER.indexOf(existing.startSlot);
      const existingEnd = existingStart + existing.duration - 1;

      // Check for overlap
      if (startIndex <= existingEnd && endIndex >= existingStart) {
        return existing;
      }
    }

    return null;
  }

  // Keep old method for backwards compatibility
  private async checkConflict(
    groupId: number,
    dayOfWeek: DayOfWeek,
    startSlot: TimeSlot,
    duration: number,
    excludeId?: number,
  ): Promise<Schedule | null> {
    const existingSchedules = await this.scheduleRepo.find({
      where: { groupId, dayOfWeek, isActive: true },
      relations: ['course'],
    });

    return this.findOverlappingSchedule(
      existingSchedules,
      startSlot,
      duration,
      excludeId,
    );
  }

  getTimeSlots(): TimeSlot[] {
    return TIME_SLOTS_ORDER;
  }

  getDaysOfWeek(): DayOfWeek[] {
    return Object.values(DayOfWeek);
  }
}
