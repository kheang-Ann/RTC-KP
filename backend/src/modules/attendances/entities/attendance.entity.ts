import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { Session } from '../../sessions/entities/session.entity';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EXCUSED = 'excused',
}

export enum CheckInMethod {
  CODE = 'code',
  MANUAL = 'manual',
}

@Entity('attendances')
@Unique(['sessionId', 'studentId'])
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  sessionId: string;

  @ManyToOne(() => Session, (session) => session.attendances, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sessionId' })
  session: Session;

  @Index()
  @Column({ type: 'int' })
  studentId: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'studentId' })
  student: User;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.PRESENT,
  })
  status: AttendanceStatus;

  @Column({
    type: 'enum',
    enum: CheckInMethod,
    default: CheckInMethod.CODE,
  })
  checkInMethod: CheckInMethod;

  @Column({ type: 'timestamp', nullable: true })
  checkInTime: Date;

  @Column({ type: 'int', nullable: true })
  markedById: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'markedById' })
  markedBy: User;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
