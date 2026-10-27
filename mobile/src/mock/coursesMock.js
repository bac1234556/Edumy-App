/**
 * Mock data khóa học chi tiết và tóm tắt phục vụ màn Home & CourseDetail
 */
export const COURSES_MOCK = [
  {
    id: 1,
    title: 'Lập trình React Native & Expo thực chiến 2026',
    subtitle: 'Xây dựng ứng dụng di động Android chất lượng cao từ số 0 đến xuất bản APK',
    description: 'Khóa học cung cấp kiến thức nền tảng và nâng cao về React Native, Expo Router, Material Design (React Native Paper), Axios Interceptor và quản lý state với Zustand. Phù hợp cho người mới bắt đầu đến nâng cao.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
    price: 499000,
    originalPrice: 799000,
    level: 'Cơ bản',
    categoryId: 1,
    categoryName: 'Lập trình & CNTT',
    averageRating: 4.9,
    totalReviews: 215,
    totalStudents: 1420,
    totalDurationSeconds: 43200, // 12 giờ
    isFeatured: true,
    isNew: false,
    instructor: {
      id: 101,
      fullName: 'Trần Văn Chuyên',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80',
      bio: 'Senior Mobile Engineer tại tập đoàn công nghệ, 8+ năm kinh nghiệm phát triển Android/iOS.'
    },
    curriculum: [
      {
        id: 1,
        title: 'Chương 1: Khởi động dự án & Expo Router',
        orderIndex: 1,
        lessons: [
          { id: 101, title: 'Bài 1: Giới thiệu lộ trình & Thiết lập môi trường', duration: '08:30', isPreview: true },
          { id: 102, title: 'Bài 2: Cấu trúc thư mục Monorepo & Expo Router', duration: '14:20', isPreview: true },
          { id: 103, title: 'Bài 3: Tích hợp React Native Paper Design System', duration: '18:45', isPreview: false }
        ]
      },
      {
        id: 2,
        title: 'Chương 2: Thiết kế Giao diện Khám phá (Catalog)',
        orderIndex: 2,
        lessons: [
          { id: 201, title: 'Bài 4: Xây dựng Component CourseCard & RatingStars', duration: '22:10', isPreview: false },
          { id: 202, title: 'Bài 5: Tối ưu cuộn danh sách với FlatList & Pull-to-Refresh', duration: '16:50', isPreview: false },
          { id: 203, title: 'Bài 6: Xử lý 3 trạng thái: Loading, Empty Data, Error State', duration: '19:15', isPreview: false }
        ]
      },
      {
        id: 3,
        title: 'Chương 3: Kết nối API Spring Boot & Video Player',
        orderIndex: 3,
        lessons: [
          { id: 301, title: 'Bài 7: Gọi RESTful API với Axios & Response Wrapper', duration: '25:40', isPreview: false },
          { id: 302, title: 'Bài 8: Phát video trực tiếp từ Cloudinary bằng expo-video', duration: '28:10', isPreview: false },
          { id: 303, title: 'Bài 9: Theo dõi tiến độ học tập (Progress Tracking >=90%)', duration: '21:05', isPreview: false }
        ]
      }
    ]
  },
  {
    id: 2,
    title: 'Spring Boot 3.4 & Microservices Architecture',
    subtitle: 'Thiết kế Backend chuẩn Enterprise, Spring Security 6, JWT và Docker',
    description: 'Nắm vững kiến thức xây dựng hệ sinh thái Microservices hiện đại bằng Spring Boot 3.4, kết nối MySQL 8 qua Docker Compose, quản lý migration phiên bản với Flyway và tài liệu hóa tự động bằng Swagger OpenAPI.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80',
    price: 599000,
    originalPrice: 899000,
    level: 'Trung cấp',
    categoryId: 1,
    categoryName: 'Lập trình & CNTT',
    averageRating: 4.8,
    totalReviews: 142,
    totalStudents: 980,
    totalDurationSeconds: 54000,
    isFeatured: true,
    isNew: false,
    instructor: {
      id: 102,
      fullName: 'Lê Hoàng Nam',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&q=80',
      bio: 'Java Backend Architect, tác giả nhiều dự án mã nguồn mở.'
    },
    curriculum: [
      {
        id: 1,
        title: 'Chương 1: Tổng quan Spring Boot 3 & Java 21',
        orderIndex: 1,
        lessons: [
          { id: 101, title: 'Bài 1: Virtual Threads trong Java 21', duration: '12:15', isPreview: true },
          { id: 102, title: 'Bài 2: Cấu hình Maven Monorepo', duration: '15:30', isPreview: false }
        ]
      }
    ]
  },
  {
    id: 3,
    title: 'Thiết kế UI/UX Chuyên nghiệp với Figma',
    subtitle: 'Tư duy thiết kế Design System chuẩn Material Design và Prototype tương tác',
    description: 'Học cách xây dựng bản vẽ Wireframe, thiết kế giao diện ứng dụng di động chuẩn UX, tạo component linh hoạt với Auto Layout và biến thể Variants.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&q=80',
    price: 0, // Miễn phí
    originalPrice: 350000,
    level: 'Tất cả cấp độ',
    categoryId: 2,
    categoryName: 'Thiết kế đồ họa',
    averageRating: 4.7,
    totalReviews: 98,
    totalStudents: 2300,
    totalDurationSeconds: 28800,
    isFeatured: true,
    isNew: true,
    instructor: {
      id: 103,
      fullName: 'Phạm Mỹ Linh',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
      bio: 'Lead Product Designer với 6 năm kinh nghiệm thiết kế ứng dụng EdTech.'
    },
    curriculum: [
      {
        id: 1,
        title: 'Chương 1: Làm quen với Figma',
        orderIndex: 1,
        lessons: [
          { id: 101, title: 'Bài 1: Giao diện và công cụ vẽ Frame', duration: '10:00', isPreview: true },
          { id: 102, title: 'Bài 2: Auto Layout nâng cao', duration: '16:40', isPreview: true }
        ]
      }
    ]
  },
  {
    id: 4,
    title: 'Kinh doanh & Khởi nghiệp Tinh gọn (Lean Startup)',
    subtitle: 'Xác thực ý tưởng sản phẩm MVP và tìm kiếm khách hàng đầu tiên',
    description: 'Quy trình khởi nghiệp thực chiến từ việc tìm kiếm nhu cầu thị trường, định hình MVP, kiểm chứng giả thuyết đến tối ưu hóa chi phí vận hành.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    price: 399000,
    originalPrice: 600000,
    level: 'Cơ bản',
    categoryId: 3,
    categoryName: 'Kinh doanh',
    averageRating: 4.85,
    totalReviews: 76,
    totalStudents: 650,
    totalDurationSeconds: 21600,
    isFeatured: false,
    isNew: true,
    instructor: {
      id: 104,
      fullName: 'Đỗ Quốc Bảo',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
      bio: 'Founder & CEO của hệ sinh thái khởi nghiệp EdTech.'
    },
    curriculum: [
      {
        id: 1,
        title: 'Chương 1: Tư duy khởi nghiệp tinh gọn',
        orderIndex: 1,
        lessons: [
          { id: 101, title: 'Bài 1: Vòng lặp Xây dựng - Đo lường - Học hỏi', duration: '14:20', isPreview: true }
        ]
      }
    ]
  }
];
