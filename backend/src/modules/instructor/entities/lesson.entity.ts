import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LessonType } from '../enums/lesson-type.enum';
import { Section } from './section.entity';

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'section_id', type: 'bigint' })
  section_id: number;

  @ManyToOne(() => Section, (section) => section.lessons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'section_id' })
  section: Section;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({
    type: 'enum',
    enum: LessonType,
    default: LessonType.VIDEO,
  })
  type: LessonType;

  @Column({ name: 'video_url', type: 'varchar', length: 1000, nullable: true })
  video_url?: string;

  @Column({ name: 'public_id', type: 'varchar', length: 255, nullable: true })
  public_id?: string;

  @Column({ name: 'duration_sec', type: 'int', default: 0 })
  duration_sec: number;

  @Column({ name: 'is_preview', type: 'boolean', default: false })
  is_preview: boolean;

  @Column({ type: 'int', default: 1 })
  position: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}