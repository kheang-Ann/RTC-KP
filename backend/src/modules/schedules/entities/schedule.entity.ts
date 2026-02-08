import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Course } from 'src/modules/courses/entities/course.entity';
import { Group } from 'src/modules/groups/entities/group.entity';

export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

export enum ScheduleType {
  LECTURE = 'lecture',
  PRACTICAL = 'practical',
  LAB = 'lab',
}

export enum TimeSlot {
  SLOT_7_8 = '07:00-08:00',
  SLOT_8_9 = '08:00-09:00',
  SLOT_9_10 = '09:00-10:00',
  SLOT_10_11 = '10:00-11:00',
  SLOT_13_14 = '13:00-14:00',
  SLOT_14_15 = '14:00-15:00',
  SLOT_15_16 = '15:00-16:00',
  SLOT_16_17 = '16:00-17:00',
}

export enum Semester {
  SEMESTER_1 = 1,
  SEMESTER_2 = 2,
}

@Entity('schedules')
@Index(['groupId', 'dayOfWeek', 'startSlot', 'semester'], { unique: true }) // Prevent double booking for same group in same semester
export class Schedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'uuid' })
  courseId: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Index()
  @Column({ type: 'int' })
  groupId: number;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group: Group;

  @Column({ type: 'int', default: 1, comment: 'Semester 1 or 2' })
  semester: number;

  @Column({ type: 'int', default: 16, comment: 'Number of weeks in semester' })
  semesterWeeks: number;

  @Column({ type: 'enum', enum: DayOfWeek })
  dayOfWeek: DayOfWeek;

  @Column({ type: 'enum', enum: TimeSlot, comment: 'Starting time slot' })
  startSlot: TimeSlot;

  @Column({
    type: 'int',
    default: 1,
    comment: 'Duration in number of slots (hours)',
  })
  duration: number;

  @Column({ type: 'enum', enum: ScheduleType })
  type: ScheduleType;

  @Column({ type: 'varchar', length: 50 })
  roomNumber: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Color for display (hex code)',
  })
  color: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
