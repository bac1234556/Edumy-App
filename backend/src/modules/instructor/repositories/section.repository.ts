import { Section } from '../entities/section.entity';

export interface ISectionRepository {
  findById(id: number): Promise<Section | null>;
  findByCourseId(courseId: number): Promise<Section[]>;
  create(data: Partial<Section>): Promise<Section>;
  update(id: number, data: Partial<Section>): Promise<Section | null>;
  delete(id: number): Promise<boolean>;
}

export class SectionRepository implements ISectionRepository {
  private sections: Section[] = [];

  async findById(id: number): Promise<Section | null> {
    return this.sections.find((item) => item.id === id) || null;
  }

  async findByCourseId(courseId: number): Promise<Section[]> {
    return this.sections
      .filter((item) => item.course_id === courseId)
      .sort((a, b) => a.position - b.position);
  }

  async create(data: Partial<Section>): Promise<Section> {
    const newSection = Object.assign(new Section(), {
      ...data,
      id: this.sections.length + 1,
      created_at: new Date(),
      updated_at: new Date(),
    });
    this.sections.push(newSection);
    return newSection;
  }

  async update(id: number, data: Partial<Section>): Promise<Section | null> {
    const section = await this.findById(id);
    if (!section) return null;
    Object.assign(section, data, { updated_at: new Date() });
    return section;
  }

  async delete(id: number): Promise<boolean> {
    const index = this.sections.findIndex((item) => item.id === id);
    if (index === -1) return false;
    this.sections.splice(index, 1);
    return true;
  }
}