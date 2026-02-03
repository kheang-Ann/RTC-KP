import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum LibraryItemCategory {
  BOOK = 'book',
  DOCUMENT = 'document',
  PUBLICATION = 'publication',
  RESEARCH_PAPER = 'research_paper',
  GUIDE = 'guide',
  OTHER = 'other',
}

@Entity('library_items')
export class LibraryItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  author: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: LibraryItemCategory,
    default: LibraryItemCategory.OTHER,
  })
  category: LibraryItemCategory;

  @Column()
  fileName: string;

  @Column()
  filePath: string;

  @Column()
  fileSize: number;

  @Column({ nullable: true })
  fileType: string;

  @Column()
  uploadedBy: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploadedBy' })
  uploader: User;

  @Column({ nullable: true })
  coverImagePath: string;

  @Column({ type: 'int', default: 0 })
  downloadCount: number;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'boolean', default: true })
  isPublished: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
