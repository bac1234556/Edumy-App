import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({ description: 'Tiêu đề khóa học', example: 'Khóa học lập trình TypeScript từ cơ bản đến nâng cao' })
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @IsString({ message: 'Tiêu đề phải là chuỗi ký tự' })
  title: string;

  @ApiPropertyOptional({ description: 'Phụ đề khóa học', example: 'Học TypeScript thực chiến qua các dự án thực tế' })
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết', example: 'Nội dung khóa học chi tiết...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Giá khóa học (VNĐ)', example: 199000, minimum: 0 })
  @IsNumber({}, { message: 'Giá phải là số hợp lệ' })
  @Min(0, { message: 'Giá khóa học phải lớn hơn hoặc bằng 0' })
  price: number;

  @ApiPropertyOptional({ description: 'Đường dẫn ảnh bìa', example: 'https://example.com/thumb.jpg' })
  @IsOptional()
  @IsString()
  thumbnail_url?: string;

  @ApiPropertyOptional({ description: 'Trình độ', example: 'BEGINNER' })
  @IsOptional()
  @IsString()
  level?: string;

  @ApiPropertyOptional({ description: 'ID danh mục', example: 1 })
  @IsOptional()
  @IsNumber()
  category_id?: number;
}