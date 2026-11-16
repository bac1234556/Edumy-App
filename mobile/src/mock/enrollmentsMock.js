/**
 * Mock "Khóa học của tôi" — cùng cấu trúc với GET /api/me/enrollments (stub W7-D3)
 */
export const ENROLLMENTS_MOCK = [
  {
    id: 1,
    courseId: 1,
    courseTitle: 'Lập trình React Native & Expo thực chiến 2026',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
    instructorName: 'Trần Văn Chuyên',
    progressPercent: 33,
    completedLessons: 3,
    totalLessons: 9,
    enrolledAt: '2026-10-28T09:00:00',
    completedAt: null,
  },
  {
    id: 2,
    courseId: 3,
    courseTitle: 'Thiết kế UI/UX Chuyên nghiệp với Figma',
    thumbnailUrl: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&q=80',
    instructorName: 'Phạm Mỹ Linh',
    progressPercent: 100,
    completedLessons: 6,
    totalLessons: 6,
    enrolledAt: '2026-10-13T20:15:00',
    completedAt: '2026-10-31T21:40:00',
  },
];
