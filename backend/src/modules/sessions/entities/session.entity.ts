import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  BeforeInsert,
} from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { Course } from '../../courses/entities/course.entity';
import { Attendance } from '../../attendances/entities/attendance.entity';

export enum SessionStatus {
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Index()
  @Column({ type: 'uuid' })
  courseId: string;

  @ManyToOne(() => Course, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Index()
  @Column({ type: 'int' })
  createdById: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;

  @Index({ unique: true })
  @Column({ length: 8 })
  attendanceCode: string;

  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.SCHEDULED,
  })
  status: SessionStatus;

  @Column({ default: true })
  isCodeActive: boolean;

  @OneToMany(() => Attendance, (attendance) => attendance.session)
  attendances: Attendance[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateAttendanceCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.attendanceCode = code;
  }
}
