import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum RequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FULFILLED = 'fulfilled',
}

@Entity('library_requests')
export class LibraryRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  requestedBy: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requestedBy' })
  requester: User;

  @Column()
  title: string;

  @Column({ nullable: true })
  author: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  justification: string;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  status: RequestStatus;

  @Column({ nullable: true })
  approvedBy: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approvedBy' })
  approver: User;

  @Column({ nullable: true, type: 'text' })
  rejectionReason: string;

  @Column({ nullable: true, type: 'timestamp' })
  approvedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
