import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { CourseStatus } from '../enums/course-status.enum';
import { Section } from './section.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  subtitle?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  price: number;

  @Column({ name: 'thumbnail_url', type: 'varchar', length: 1000, nullable: true })
  thumbnail_url?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  level?: string;

  @Column({
    type: 'enum',
    enum: CourseStatus,
    default: CourseStatus.DRAFT,
  })
  status: CourseStatus;

  @Column({ name: 'reject_reason', type: 'text', nullable: true })
  reject_reason?: string;

  @Column({ name: 'category_id', type: 'bigint', nullable: true })
  category_id?: number;

  @Column({ name: 'instructor_id', type: 'bigint' })
  instructor_id: number;

  @OneToMany(() => Section, (section) => section.course, { cascade: true })
  sections: Section[];

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}