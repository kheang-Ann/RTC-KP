import {
  Column,
  Entity,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToOne,
} from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

@Entity('teachers')
export class Teacher {
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

  // Contact Information
  @Column()
  personalEmail: string;

  @Column({ type: 'simple-array' })
  phoneNumbers: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
