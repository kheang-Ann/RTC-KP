import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Exclude, Transform } from 'class-transformer';
import { UserRole } from './user-role.entity';
import { RefreshToken } from './refresh-toke.entity';
import { Department } from 'src/modules/departments/entity/department.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  nameKhmer: string | null;

  @Column({ type: 'varchar', nullable: true })
  nameLatin: string | null;

  @Column({ select: false })
  @Exclude()
  passwordHash: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => UserRole, (ur) => ur.user)
  @Transform(
    ({ value }: { value: UserRole[] }) =>
      value?.map((ur) => ur.role?.name) ?? [],
  )
  roles: UserRole[];

  @OneToMany(() => RefreshToken, (rt) => rt.user)
  @Exclude()
  refreshTokens: RefreshToken[];

  @Index()
  @Column({ type: 'int', nullable: true })
  departmentId: number | null;

  @ManyToOne(() => Department, (department) => department.users, {
    nullable: true,
  })
  @JoinColumn({ name: 'departmentId' })
  department: Department;

  @CreateDateColumn()
  createdAt: Date;
}
