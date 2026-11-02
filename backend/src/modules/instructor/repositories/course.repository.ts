import { Course } from '../entities/course.entity';
import { CourseStatus } from '../enums/course-status.enum';

export interface ICourseRepository {
  findById(id: number): Promise<Course | null>;
  findByInstructorId(instructorId: number): Promise<Course[]>;
  findByStatus(status: CourseStatus): Promise<Course[]>;
  create(data: Partial<Course>): Promise<Course>;
  update(id: number, data: Partial<Course>): Promise<Course | null>;
  delete(id: number): Promise<boolean>;
}

export class CourseRepository implements ICourseRepository {
  private courses: Course[] = [];

  async findById(id: number): Promise<Course | null> {
    return this.courses.find((item) => item.id === id) || null;
  }

  async findByInstructorId(instructorId: number): Promise<Course[]> {
    return this.courses.filter((item) => item.instructor_id === instructorId);
  }

  async findByStatus(status: CourseStatus): Promise<Course[]> {
    return this.courses.filter((item) => item.status === status);
  }

  async create(data: Partial<Course>): Promise<Course> {
    const newCourse = Object.assign(new Course(), {
      ...data,
      id: this.courses.length + 1,
      created_at: new Date(),
      updated_at: new Date(),
    });
    this.courses.push(newCourse);
    return newCourse;
  }

  async update(id: number, data: Partial<Course>): Promise<Course | null> {
    const course = await this.findById(id);
    if (!course) return null;
    Object.assign(course, data, { updated_at: new Date() });
    return course;
  }

  async delete(id: number): Promise<boolean> {
    const index = this.courses.findIndex((item) => item.id === id);
    if (index === -1) return false;
    this.courses.splice(index, 1);
    return true;
  }
}