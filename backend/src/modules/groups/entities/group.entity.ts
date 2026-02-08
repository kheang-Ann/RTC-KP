import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Program } from 'src/modules/programs/entities/program.entity';
import { Student } from 'src/modules/students/entities/student.entity';

@Entity('groups')
@Index(['programId', 'academicYear', 'name'], { unique: true })
export class Group {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // e.g., "A", "B", "C" or "Group 1", "Group 2"

  @Index()
  @Column({ type: 'int' })
  programId: number;

  @ManyToOne(() => Program, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'programId' })
  program: Program;

  @Column({ type: 'int', comment: 'Academic year (1, 2, 3, etc.)' })
  academicYear: number;

  @Column({
    type: 'int',
    default: 50,
    comment: 'Maximum students in this group',
  })
  maxCapacity: number;

  @OneToMany(() => Student, (student) => student.group)
  students: Student[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
