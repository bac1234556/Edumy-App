/**
 * This file is generated from OpenAPI (/v3/api-docs) / docs/ai/api-contract.md.
 * Do not edit directly; run `npm run gen:api` when backend dev server is running.
 */

export interface paths {
  '/auth/mobile/register': {
    post: {
      requestBody: {
        content: {
          'application/json': components['schemas']['MobileRegisterRequest'];
        };
      };
      responses: {
        201: {
          content: {
            'application/json': components['schemas']['MobileTokens'];
          };
        };
      };
    };
  };
  '/auth/mobile/login': {
    post: {
      requestBody: {
        content: {
          'application/json': components['schemas']['MobileLoginRequest'];
        };
      };
      responses: {
        200: {
          content: {
            'application/json': components['schemas']['MobileTokens'];
          };
        };
      };
    };
  };
  '/auth/mobile/refresh': {
    post: {
      requestBody: {
        content: {
          'application/json': components['schemas']['MobileRefreshRequest'];
        };
      };
      responses: {
        200: {
          content: {
            'application/json': components['schemas']['MobileTokens'];
          };
        };
      };
    };
  };
  '/auth/mobile/logout': {
    post: {
      requestBody?: {
        content: {
          'application/json': components['schemas']['MobileLogoutRequest'];
        };
      };
      responses: {
        204: {
          content: never;
        };
      };
    };
  };
  '/me': {
    get: {
      responses: {
        200: {
          content: {
            'application/json': components['schemas']['UserProfile'];
          };
        };
      };
    };
  };
  '/catalog/courses': {
    get: {
      parameters?: {
        query?: {
          q?: string;
          categoryId?: number;
          price?: 'free' | 'paid';
          sort?: 'newest' | 'rating' | 'price_asc' | 'price_desc';
          page?: number;
          size?: number;
        };
      };
      responses: {
        200: {
          content: {
            'application/json': {
              content: components['schemas']['CourseCard'][];
              page: components['schemas']['PageMetadata'];
              suggestions?: components['schemas']['CourseCard'][];
            };
          };
        };
      };
    };
  };
}

export interface components {
  schemas: {
    MobileTokens: {
      accessToken: string;
      expiresAt: string;
      refreshToken: string;
      refreshExpiresAt: string;
    };
    MobileRegisterRequest: {
      email: string;
      password: string;
      fullName: string;
    };
    MobileLoginRequest: {
      email: string;
      password: string;
    };
    MobileRefreshRequest: {
      refreshToken: string;
    };
    MobileLogoutRequest: {
      refreshToken?: string;
    };
    UserProfile: {
      id: number;
      email: string;
      fullName: string;
      emailVerified: boolean;
      roles: string[];
      createdAt: string;
    };
    CourseCard: {
      id: number;
      slug: string;
      title: string;
      thumbnailUrl?: string;
      price: number;
      isFree: boolean;
      categoryId?: number;
      categoryName?: string;
      instructorName?: string;
      averageRating?: number;
      ratingCount?: number;
      publishedAt?: string;
    };
    CourseDetail: {
      id: number;
      slug: string;
      title: string;
      description?: string;
      thumbnailUrl?: string;
      price: number;
      isFree: boolean;
      status: string;
      categoryId?: number;
      categoryName?: string;
      mainInstructor: {
        id: number;
        fullName: string;
      };
      coInstructors?: {
        id: number;
        fullName: string;
      }[];
      averageRating?: number;
      ratingCount?: number;
      totalLessons?: number;
      totalDurationSeconds?: number;
      publishedAt?: string;
      updatedAt?: string;
      chapters?: components['schemas']['ChapterDetail'][];
      viewer?: {
        owned: boolean;
        inCart: boolean;
        isInstructor: boolean;
      } | null;
    };
    ChapterDetail: {
      id: number;
      title: string;
      lessons: components['schemas']['LessonSummary'][];
    };
    LessonSummary: {
      id: number;
      title: string;
      contentType: 'video' | 'article';
      durationSeconds?: number;
      isPreview: boolean;
      completed?: boolean;
    };
    LessonDetail: {
      id: number;
      courseId: number;
      chapterId: number;
      title: string;
      contentType: 'video' | 'article';
      durationSeconds?: number;
      videoUrl?: string;
      articleContent?: string;
      completed?: boolean;
    };
    CourseLearnRoom: {
      courseId: number;
      title: string;
      enrolled: boolean;
      progress: {
        completedLessons: number;
        totalLessons: number;
        percent: number;
      } | null;
      chapters: {
        id: number;
        title: string;
        lessons: {
          id: number;
          title: string;
          contentType: 'video' | 'article';
          durationSeconds?: number;
          preview: boolean;
          completed?: boolean;
        }[];
      }[];
    };
    LessonCompletionResponse: {
      lessonId: number;
      completed: boolean;
      completedAt?: string;
      completedLessons: number;
      totalLessons: number;
      progressPercent: number;
      certificateCode?: string;
      certificateIssued: boolean;
    };
    Cart: {
      items: components['schemas']['CartItem'][];
      itemCount: number;
      purchasableCount: number;
      totalAmount: number;
    };
    CartItem: {
      courseId: number;
      title: string;
      slug: string;
      thumbnailUrl?: string;
      price: number;
      isFree: boolean;
      instructor: {
        id: number;
        fullName: string;
      };
      addedAt: string;
      purchasable: boolean;
      unavailableReason?: string;
    };
    Enrollment: {
      id: number;
      course: {
        id: number;
        title: string;
        slug: string;
        thumbnailUrl?: string;
        published: boolean;
      };
      enrollSource: string;
      enrolledAt: string;
      completedLessons: number;
      totalLessons: number;
      progressPercent: number;
      lastAccessedLessonId?: number;
      lastAccessedAt?: string;
      certificateCode?: string;
    };
    QuestionThread: {
      id: number;
      courseId: number;
      lessonId?: number;
      title: string;
      content: string;
      resolved: boolean;
      status: string;
      asker: {
        id: number;
        fullName: string;
      };
      instructorReplied: boolean;
      createdAt: string;
      updatedAt?: string;
      answers: components['schemas']['QuestionAnswer'][];
    };
    QuestionAnswer: {
      id: number;
      author: {
        id: number;
        fullName: string;
      };
      authorType: string;
      content: string;
      status: string;
      createdAt: string;
      updatedAt?: string;
    };
    CertificateItem: {
      id: number;
      certificateCode: string;
      enrollmentId: number;
      courseId: number;
      courseTitle: string;
      studentName: string;
      instructorName?: string;
      issuedAt: string;
    };
    OrderItem: {
      courseId: number;
      title: string;
      slug: string;
      thumbnailUrl?: string;
      unitPrice: number;
    };
    OrderPayment: {
      transactionRef?: string;
      amount: number;
      status: string;
      qrExpiresAt?: string;
      confirmedAt?: string;
      createdAt: string;
    };
    OrderSummary: {
      orderCode: string;
      totalAmount: number;
      status: 'pending' | 'paid' | 'cancelled';
      cancelReason?: 'user' | 'replaced' | 'expired';
      itemCount: number;
      createdAt: string;
      paidAt?: string;
      cancelledAt?: string;
    };
    OrderDetail: {
      orderCode: string;
      totalAmount: number;
      status: 'pending' | 'paid' | 'cancelled';
      cancelReason?: 'user' | 'replaced' | 'expired';
      createdAt: string;
      paidAt?: string;
      cancelledAt?: string;
      items: components['schemas']['OrderItem'][];
      payments?: components['schemas']['OrderPayment'][];
    };
    PageMetadata: {
      size: number;
      number: number;
      totalElements: number;
      totalPages: number;
    };
    ProblemDetail: {
      type?: string;
      title?: string;
      status?: number;
      detail?: string;
      code?: string;
      traceId?: string;
      errors?: {
        field?: string;
        message?: string;
      }[];
    };
  };
}
