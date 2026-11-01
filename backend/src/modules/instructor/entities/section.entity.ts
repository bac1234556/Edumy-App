import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Course } from './course.entity';
import { Lesson } from './lesson.entity';

@Entity('sections')
export class Section {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'course_id', type: 'bigint' })
  course_id: number;

  @ManyToOne(() => Course, (course) => course.sections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'int', default: 1 })
  position: number;

  @OneToMany(() => Lesson, (lesson) => lesson.section, { cascade: true })
  lessons: Lesson[];

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}