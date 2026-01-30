import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Department } from 'src/modules/departments/entity/department.entity';

export enum DegreeType {
  BACHELOR = 'Bachelor',
  MASTER = 'Master',
  PHD = 'PhD',
}

@Entity('programs')
export class Program {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'int', comment: 'Duration in years' })
  duration: number;

  @Column({ type: 'enum', enum: DegreeType })
  degreeType: DegreeType;

  @Index()
  @Column({ type: 'int' })
  departmentId: number;

  @ManyToOne(() => Department, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'departmentId' })
  department: Department;

  @CreateDateColumn()
  createdAt: Date;
}
