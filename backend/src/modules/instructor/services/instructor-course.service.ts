import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CourseRepository } from '../repositories/course.repository';
import { Course } from '../entities/course.entity';
import { CourseStatus } from '../enums/course-status.enum';
import { CreateCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDto } from '../dto/update-course.dto';

@Injectable()
export class InstructorCourseService {
  constructor(private readonly courseRepository: CourseRepository) {}

  async getCoursesByInstructor(instructorId: number): Promise<Course[]> {
    return this.courseRepository.findByInstructorId(instructorId);
  }

  async getCourseDetail(courseId: number, instructorId: number): Promise<Course> {
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundException(`Không tìm thấy khóa học với ID: ${courseId}`);
    }

    // Kiểm tra quyền sở hữu
    if (Number(course.instructor_id) !== Number(instructorId)) {
      throw new ForbiddenException('Bạn không có quyền truy cập khóa học này');
    }

    return course;
  }

  async createCourse(
    instructorId: number,
    createDto: CreateCourseDto,
  ): Promise<Course> {
    const newCourseData: Partial<Course> = {
      ...createDto,
      instructor_id: instructorId,
      status: CourseStatus.DRAFT, // Mặc định trạng thái DRAFT
    };

    return this.courseRepository.create(newCourseData);
  }

  async updateCourse(
    courseId: number,
    instructorId: number,
    updateDto: UpdateCourseDto,
  ): Promise<Course> {
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundException(`Không tìm thấy khóa học với ID: ${courseId}`);
    }

    // Kiểm tra quyền sở hữu: chỉ owner mới được sửa
    if (Number(course.instructor_id) !== Number(instructorId)) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa khóa học này');
    }

    const updated = await this.courseRepository.update(courseId, updateDto);
    return updated!;
  }

  async deleteCourse(courseId: number, instructorId: number): Promise<void> {
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundException(`Không tìm thấy khóa học với ID: ${courseId}`);
    }

    // Kiểm tra quyền sở hữu: chỉ owner mới được xóa
    if (Number(course.instructor_id) !== Number(instructorId)) {
      throw new ForbiddenException('Bạn không có quyền xóa khóa học này');
    }

    await this.courseRepository.delete(courseId);
  }
}