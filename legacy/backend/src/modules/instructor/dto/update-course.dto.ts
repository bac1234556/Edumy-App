import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class UpdateCourseDto {
  @ApiPropertyOptional({ description: 'Tiêu đề khóa học' })
  @IsOptional()
  @IsString({ message: 'Tiêu đề phải là chuỗi ký tự' })
  title?: string;

  @ApiPropertyOptional({ description: 'Phụ đề' })
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiPropertyOptional({ description: 'Mô tả' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Giá khóa học', minimum: 0 })
  @IsOptional()
  @IsNumber({}, { message: 'Giá phải là số hợp lệ' })
  @Min(0, { message: 'Giá khóa học phải lớn hơn hoặc bằng 0' })
  price?: number;

  @ApiPropertyOptional({ description: 'Đường dẫn ảnh bìa' })
  @IsOptional()
  @IsString()
  thumbnail_url?: string;

  @ApiPropertyOptional({ description: 'Trình độ' })
  @IsOptional()
  @IsString()
  level?: string;

  @ApiPropertyOptional({ description: 'ID danh mục' })
  @IsOptional()
  @IsNumber()
  category_id?: number;
}