// src/api/query-keys.ts
// Centralized TanStack Query keys for Edumy Mobile.

export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  catalog: {
    all: ['catalog'] as const,
    categories: () => ['catalog', 'categories'] as const,
    courses: (filters: Record<string, unknown> = {}) =>
      ['catalog', 'courses', filters] as const,
    courseDetail: (slug: string) => ['catalog', 'course', slug] as const,
    courseReviews: (slug: string, page: number = 0) =>
      ['catalog', 'course', slug, 'reviews', page] as const,
    lessonPreview: (slug: string, lessonId: number) =>
      ['catalog', 'course', slug, 'preview', lessonId] as const,
  },
  cart: {
    current: ['cart'] as const,
  },
  orders: {
    all: (page: number = 0) => ['orders', page] as const,
    detail: (orderCode: string) => ['orders', 'detail', orderCode] as const,
  },
  learning: {
    all: ['learning'] as const,
    myEnrollments: (page: number = 0) => ['learning', 'enrollments', page] as const,
    courseProgress: (courseId: number) => ['learning', 'course', courseId] as const,
    lessonDetail: (lessonId: number) => ['learning', 'lesson', lessonId] as const,
  },
  qa: {
    all: ['qa'] as const,
    courseQuestions: (
      courseId: number,
      pageOrFilters: number | Record<string, unknown> = 0
    ) => ['qa', 'course', courseId, 'questions', pageOrFilters] as const,
    questionDetail: (id: number) => ['qa', 'question', id] as const,
  },
  reviews: {
    byCourse: (courseId: number) => ['reviews', 'course', courseId] as const,
  },
  certificates: {
    all: ['certificates'] as const,
    list: (page: number = 0) => ['certificates', page] as const,
  },
  instructor: {
    all: ['instructor'] as const,
    overview: () => ['instructor', 'overview'] as const,
    courses: () => ['instructor', 'courses'] as const,
    courseStudents: (courseId: number, page: number = 0) =>
      ['instructor', 'courses', courseId, 'students', page] as const,
    questions: (filters: Record<string, unknown> = {}) =>
      ['instructor', 'questions', filters] as const,
    invitations: () => ['instructor', 'invitations'] as const,
  },
  earnings: {
    all: ['earnings'] as const,
    summary: ['earnings', 'summary'] as const,
    monthly: (year?: number) => ['earnings', 'monthly', year] as const,
    courses: ['earnings', 'courses'] as const,
    entries: (filters: Record<string, unknown> = {}) =>
      ['earnings', 'entries', filters] as const,
    payoutAccount: ['earnings', 'payout-account'] as const,
    withdrawals: (page: number = 0) => ['earnings', 'withdrawals', page] as const,
  },
} as const;
