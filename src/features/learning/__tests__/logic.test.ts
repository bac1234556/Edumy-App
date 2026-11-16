// src/features/learning/__tests__/logic.test.ts
// Unit tests for learning outline resolution and media detection.

import { resolveFirstOrUncompletedLesson, isNativeStream, CourseLearnRoom } from '../logic';

describe('resolveFirstOrUncompletedLesson', () => {
  it('returns first uncompleted lesson in order', () => {
    const room: CourseLearnRoom = {
      courseId: 1,
      title: 'Khóa học',
      enrolled: true,
      progress: { completedLessons: 1, totalLessons: 3, percent: 33 },
      chapters: [
        {
          id: 1,
          title: 'Chương 1',
          lessons: [
            { id: 101, title: 'Bài 1', contentType: 'video', preview: true, completed: true },
            { id: 102, title: 'Bài 2', contentType: 'video', preview: false, completed: false },
          ],
        },
        {
          id: 2,
          title: 'Chương 2',
          lessons: [
            { id: 103, title: 'Bài 3', contentType: 'article', preview: false, completed: false },
          ],
        },
      ],
    };

    expect(resolveFirstOrUncompletedLesson(room)).toBe(102);
  });

  it('falls back to the first lesson if all lessons are already completed', () => {
    const room: CourseLearnRoom = {
      courseId: 1,
      title: 'Khóa học',
      enrolled: true,
      progress: { completedLessons: 2, totalLessons: 2, percent: 100 },
      chapters: [
        {
          id: 1,
          title: 'Chương 1',
          lessons: [
            { id: 201, title: 'Bài 1', contentType: 'video', preview: true, completed: true },
            { id: 202, title: 'Bài 2', contentType: 'video', preview: false, completed: true },
          ],
        },
      ],
    };

    expect(resolveFirstOrUncompletedLesson(room)).toBe(201);
  });

  it('returns null if chapters are empty', () => {
    const room: CourseLearnRoom = {
      courseId: 1,
      title: 'Khóa học',
      enrolled: true,
      progress: null,
      chapters: [],
    };

    expect(resolveFirstOrUncompletedLesson(room)).toBeNull();
  });
});

describe('isNativeStream', () => {
  it('detects .mp4 and .m3u8 sources including query parameters', () => {
    expect(isNativeStream('https://cdn.edumy.vn/video/lesson.mp4')).toBe(true);
    expect(isNativeStream('https://cdn.edumy.vn/hls/master.m3u8')).toBe(true);
    expect(isNativeStream('https://cdn.edumy.vn/video/lesson.mp4?token=jwt123&exp=9999')).toBe(true);
  });

  it('returns false for web or unknown streaming formats', () => {
    expect(isNativeStream('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(false);
    expect(isNativeStream('https://player.vimeo.com/video/12345')).toBe(false);
    expect(isNativeStream(null)).toBe(false);
    expect(isNativeStream(undefined)).toBe(false);
  });
});
