import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { UserRole } from './user-role.entity';
import { RefreshToken } from './refresh-toke.entity';
// import { CourseEnrollment } from 'src/modules/courses/entities/course-enrollment.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => UserRole, (ur) => ur.user)
  roles: UserRole[];

  @OneToMany(() => RefreshToken, (rt) => rt.user)
  refreshTokens: RefreshToken[];

  // @OneToMany(() => CourseEnrollment, (e) => e.student)
  // enrollments?: CourseEnrollment[];

  @CreateDateColumn()
  createdAt: Date;
}
