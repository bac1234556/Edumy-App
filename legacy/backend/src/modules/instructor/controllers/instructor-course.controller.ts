import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Request,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InstructorCourseService } from '../services/instructor-course.service';
import { CreateCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDto } from '../dto/update-course.dto';

@ApiTags('Instructor Courses')
@ApiBearerAuth()
@Controller('api/instructor/courses')
export class InstructorCourseController {
  constructor(private readonly courseService: InstructorCourseService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách khóa học của instructor' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy danh sách khóa học thành công',
    schema: {
      example: {
        success: true,
        data: [],
        message: 'Lấy danh sách khóa học thành công',
      },
    },
  })
  async getMyCourses(@Request() req: any) {
    // instructor_id lấy từ token (req.user.id), fallback giả lập 1 nếu chưa cấu hình Auth Guard
    const instructorId = req.user?.id || 1;
    const courses = await this.courseService.getCoursesByInstructor(instructorId);
    return {
      success: true,
      data: courses,
      message: 'Lấy danh sách khóa học thành công',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết khóa học theo ID' })
  @ApiParam({ name: 'id', description: 'ID khóa học', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy chi tiết khóa học thành công',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Không có quyền truy cập khóa học của instructor khác (403)',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy khóa học (404)',
  })
  async getCourseDetail(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    const instructorId = req.user?.id || 1;
    const course = await this.courseService.getCourseDetail(id, instructorId);
    return {
      success: true,
      data: course,
      message: 'Lấy chi tiết khóa học thành công',
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo mới một khóa học (trạng thái ban đầu DRAFT)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tạo khóa học thành công',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dữ liệu đầu vào không hợp lệ (400)',
  })
  async createCourse(
    @Body() createDto: CreateCourseDto,
    @Request() req: any,
  ) {
    const instructorId = req.user?.id || 1;
    const created = await this.courseService.createCourse(instructorId, createDto);
    return {
      success: true,
      data: created,
      message: 'Tạo khóa học thành công',
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Chỉnh sửa thông tin khóa học (chỉ owner)' })
  @ApiParam({ name: 'id', description: 'ID khóa học', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cập nhật khóa học thành công',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Instructor khác sửa khóa nhận lỗi 403',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy khóa học (404)',
  })
  async updateCourse(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateCourseDto,
    @Request() req: any,
  ) {
    const instructorId = req.user?.id || 1;
    const updated = await this.courseService.updateCourse(id, instructorId, updateDto);
    return {
      success: true,
      data: updated,
      message: 'Cập nhật khóa học thành công',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa khóa học (chỉ owner)' })
  @ApiParam({ name: 'id', description: 'ID khóa học', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Xóa khóa học thành công',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Instructor khác xóa khóa nhận lỗi 403',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy khóa học (404)',
  })
  async deleteCourse(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    const instructorId = req.user?.id || 1;
    await this.courseService.deleteCourse(id, instructorId);
    return {
      success: true,
      data: null,
      message: 'Xóa khóa học thành công',
    };
  }
}