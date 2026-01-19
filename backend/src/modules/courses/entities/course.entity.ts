import { Department } from 'src/modules/departments/entity/department.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  OneToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { Enrollment } from '../../enrollments/entities/enrollment.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Index()
  @Column({ type: 'int', nullable: true })
  departmentId: number | null;

  @OneToOne(() => Department)
  @JoinColumn({ name: 'departmentId' })
  department: Department;

  @Index()
  @Column({ type: 'int', nullable: true })
  teacherId: number | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'teacherId' })
  teacher: User;

  @OneToMany(() => Enrollment, (enrollment) => enrollment.course)
  enrollments: Enrollment[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
