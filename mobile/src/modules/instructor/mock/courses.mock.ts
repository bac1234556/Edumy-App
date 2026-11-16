export interface CourseItem {
  id: number;
  title: string;
  subtitle?: string;
  description?: string;
  price: number;
  thumbnail_url?: string;
  level: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';
  category_id?: number;
}

export const MOCK_COURSES: CourseItem[] = [
  {
    id: 1,
    title: 'Lập trình React Native thực chiến',
    subtitle: 'Xây dựng ứng dụng hoàn chỉnh từ con số 0',
    description: 'Khóa học cung cấp đầy đủ kiến thức về React Native, Hooks, Redux Toolkit và Navigation.',
    price: 299000,
    thumbnail_url: 'https://picsum.photos/300/200?random=1',
    level: 'BEGINNER',
    status: 'PUBLISHED',
    category_id: 1,
  },
  {
    id: 2,
    title: 'Node.js & NestJS Backend Masterclass',
    subtitle: 'Thiết kế REST API chuẩn Microservices',
    description: 'Học kiến trúc Clean Architecture, Docker, JWT và triển khai lên Cloud.',
    price: 399000,
    thumbnail_url: 'https://picsum.photos/300/200?random=2',
    level: 'INTERMEDIATE',
    status: 'DRAFT',
    category_id: 2,
  },
  {
    id: 3,
    title: 'UI/UX Mobile Design với Figma',
    subtitle: 'Tư duy thiết kế giao diện di động chuẩn UX',
    description: 'Nắm vững quy tắc bố cục, màu sắc, typography và tạo prototype tương tác.',
    price: 0,
    thumbnail_url: 'https://picsum.photos/300/200?random=3',
    level: 'ALL_LEVELS',
    status: 'PENDING_REVIEW',
    category_id: 3,
  },
];