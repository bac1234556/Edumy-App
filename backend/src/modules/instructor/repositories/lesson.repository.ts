import { Lesson } from '../entities/lesson.entity';

export interface ILessonRepository {
  findById(id: number): Promise<Lesson | null>;
  findBySectionId(sectionId: number): Promise<Lesson[]>;
  create(data: Partial<Lesson>): Promise<Lesson>;
  update(id: number, data: Partial<Lesson>): Promise<Lesson | null>;
  delete(id: number): Promise<boolean>;
}

export class LessonRepository implements ILessonRepository {
  private lessons: Lesson[] = [];

  async findById(id: number): Promise<Lesson | null> {
    return this.lessons.find((item) => item.id === id) || null;
  }

  async findBySectionId(sectionId: number): Promise<Lesson[]> {
    return this.lessons
      .filter((item) => item.section_id === sectionId)
      .sort((a, b) => a.position - b.position);
  }

  async create(data: Partial<Lesson>): Promise<Lesson> {
    const newLesson = Object.assign(new Lesson(), {
      ...data,
      id: this.lessons.length + 1,
      created_at: new Date(),
      updated_at: new Date(),
    });
    this.lessons.push(newLesson);
    return newLesson;
  }

  async update(id: number, data: Partial<Lesson>): Promise<Lesson | null> {
    const lesson = await this.findById(id);
    if (!lesson) return null;
    Object.assign(lesson, data, { updated_at: new Date() });
    return lesson;
  }

  async delete(id: number): Promise<boolean> {
    const index = this.lessons.findIndex((item) => item.id === id);
    if (index === -1) return false;
    this.lessons.splice(index, 1);
    return true;
  }
}