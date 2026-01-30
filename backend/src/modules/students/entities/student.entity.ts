import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToOne,
} from 'typeorm';
import { Department } from 'src/modules/departments/entity/department.entity';
import { Program } from 'src/modules/programs/entities/program.entity';
import { User } from 'src/modules/users/entities/user.entity';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

export enum AcademicStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  LEAVE = 'leave',
  GRADUATION = 'graduation',
}

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  // Link to User for authentication
  @Index()
  @Column({ type: 'int', nullable: true })
  userId: number | null;

  @OneToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  // Profile image
  @Column({ type: 'varchar', nullable: true })
  image: string | null;

  // Personal Information
  @Column()
  nameKhmer: string;

  @Column()
  nameLatin: string;

  @Column({ type: 'enum', enum: Gender })
  gender: Gender;

  @Column({ type: 'date' })
  dob: Date;

  // Academic Information
  @Index()
  @Column({ type: 'int' })
  departmentId: number;

  @ManyToOne(() => Department, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'departmentId' })
  department: Department;

  @Index()
  @Column({ type: 'int' })
  programId: number;

  @ManyToOne(() => Program, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'programId' })
  program: Program;

  @Column({
    type: 'enum',
    enum: AcademicStatus,
    default: AcademicStatus.ACTIVE,
  })
  academicStatus: AcademicStatus;

  @Column({ type: 'int', default: 1 })
  academicYear: number;

  // Contact Information
  @Column()
  personalEmail: string;

  @Column({ type: 'simple-array' })
  phoneNumbers: string[];

  @Column({ type: 'simple-array' })
  emergencyPhoneNumbers: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
