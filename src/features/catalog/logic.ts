// src/features/catalog/logic.ts
// Pure business logic for course action resolution (D-M02, rules 40).

export interface CourseViewerState {
  owned: boolean;
  inCart: boolean;
  isInstructor: boolean;
}

export interface ResolveCourseActionInput {
  isLoggedIn: boolean;
  isFree: boolean;
  viewer?: CourseViewerState | null;
}

export type CoursePrimaryAction =
  | 'LOGIN_TO_LEARN'
  | 'OPEN_LEARNING'
  | 'FREE_ENROLL'
  | 'ALREADY_IN_CART'
  | 'ADD_TO_CART'
  | null;

export interface CourseActionResult {
  primaryAction: CoursePrimaryAction;
  primaryLabel: string | null;
  secondaryLabel?: string | null;
  notice?: string | null;
}

/**
 * Pure function implementing Table D-M02 (Evaluate top-down, first match wins):
 * 1. not logged in -> "Đăng nhập để học" | paid: "Khóa học trả phí được mua trên website"
 * 2. isInstructor  -> none | "Bạn là giảng viên của khóa này"
 * 3. owned         -> "Vào học"
 * 4. isFree        -> "Ghi danh miễn phí"
 * 5. paid & inCart -> "Đã có trong giỏ" | "Mua trên website"
 * 6. paid & !inCart-> "Thêm vào giỏ" | "Mua trên website" + notice
 */
export function resolveCourseAction(input: ResolveCourseActionInput): CourseActionResult {
  const { isLoggedIn, isFree, viewer } = input;

  // 1. Not logged in
  if (!isLoggedIn) {
    return {
      primaryAction: 'LOGIN_TO_LEARN',
      primaryLabel: 'Đăng nhập để học',
      secondaryLabel: isFree ? undefined : 'Mua trên website',
      notice: isFree ? undefined : 'Khóa học trả phí được mua trên website',
    };
  }

  // 2. Instructor of this course
  if (viewer?.isInstructor) {
    return {
      primaryAction: null,
      primaryLabel: null,
      notice: 'Bạn là giảng viên của khóa này',
    };
  }

  // 3. Already enrolled/owned
  if (viewer?.owned) {
    return {
      primaryAction: 'OPEN_LEARNING',
      primaryLabel: 'Vào học',
    };
  }

  // 4. Free course
  if (isFree) {
    return {
      primaryAction: 'FREE_ENROLL',
      primaryLabel: 'Ghi danh miễn phí',
    };
  }

  // 5. Paid & in cart
  if (viewer?.inCart) {
    return {
      primaryAction: 'ALREADY_IN_CART',
      primaryLabel: 'Đã có trong giỏ',
      secondaryLabel: 'Mua trên website',
    };
  }

  // 6. Paid & not in cart
  return {
    primaryAction: 'ADD_TO_CART',
    primaryLabel: 'Thêm vào giỏ',
    secondaryLabel: 'Mua trên website',
    notice: 'Khóa học này được thanh toán trên website',
  };
}
