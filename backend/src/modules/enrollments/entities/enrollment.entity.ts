import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { Course } from '../../courses/entities/course.entity';

@Entity('enrollments')
@Index(['studentId', 'courseId'], { unique: true })
export class Enrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'int' })
  studentId: number;

  @ManyToOne(() => User, (user) => user.enrollments, { nullable: false })
  @JoinColumn({ name: 'studentId' })
  student: User;

  @Index()
  @Column({ type: 'uuid' })
  courseId: string;

  @ManyToOne(() => Course, (course) => course.enrollments, { nullable: false })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Column({ type: 'timestamp', nullable: true })
  enrolledAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
