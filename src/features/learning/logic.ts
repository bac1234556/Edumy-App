// src/features/learning/logic.ts
// Pure business logic for Learning room, progress, and sequential lesson navigation.

import {
  Enrollment,
  CourseLearnRoom,
  LessonDetail,
  LessonCompletionResponse,
} from './api';

export type {
  Enrollment,
  CourseLearnRoom,
  LessonDetail,
  LessonCompletionResponse,
};

export interface OrderedLessonItem {
  id: number;
  title: string;
  completed: boolean;
  chapterId?: number;
  chapterIndex: number;
  lessonIndex: number;
}

/**
 * Flattens all lessons across chapters in strict sequential order.
 */
export function getOrderedLessons(room?: CourseLearnRoom | null): OrderedLessonItem[] {
  if (!room?.chapters || room.chapters.length === 0) return [];
  const list: OrderedLessonItem[] = [];
  room.chapters.forEach((chapter, chapterIndex) => {
    (chapter.lessons ?? []).forEach((lesson, lessonIndex) => {
      if (lesson.id !== undefined) {
        list.push({
          id: lesson.id,
          title: lesson.title ?? '',
          completed: Boolean(lesson.completed),
          chapterId: chapter.id,
          chapterIndex,
          lessonIndex,
        });
      }
    });
  });
  return list;
}

/**
 * Sequential Progression Rule:
 * - Lesson 0 is always unlocked.
 * - Lesson N (N > 0) is unlocked ONLY if all previous lessons (0 .. N-1) are completed
 *   (or if the lesson itself is already completed, or in instructor preview mode where room.progress === null).
 */
export function isLessonUnlocked(
  room: CourseLearnRoom | null | undefined,
  targetLessonId: number
): boolean {
  if (!room) return true;
  if (room.progress === null) return true; // Instructor preview mode

  const ordered = getOrderedLessons(room);
  const idx = ordered.findIndex((l) => l.id === targetLessonId);
  if (idx <= 0) return true;
  if (ordered[idx].completed) return true;

  for (let i = 0; i < idx; i++) {
    if (!ordered[i].completed) {
      return false;
    }
  }
  return true;
}

/**
 * A chapter's quiz is unlocked only when all lessons in that chapter (and prior chapters) are completed.
 */
export function isChapterQuizUnlocked(
  room: CourseLearnRoom | null | undefined,
  chapterIndex: number
): boolean {
  if (!room) return true;
  if (room.progress === null) return true;
  const chapters = room.chapters ?? [];
  for (let c = 0; c <= chapterIndex && c < chapters.length; c++) {
    for (const les of chapters[c].lessons ?? []) {
      if (!les.completed) return false;
    }
  }
  return true;
}

/**
 * Finds the first uncompleted lesson in the course outline,
 * or falls back to the first available lesson in the first chapter.
 */
export function resolveFirstOrUncompletedLesson(room: CourseLearnRoom): number | null {
  if (!room.chapters || room.chapters.length === 0) return null;

  for (const chapter of room.chapters) {
    for (const lesson of chapter.lessons ?? []) {
      if (!lesson.completed && lesson.id !== undefined) {
        return lesson.id;
      }
    }
  }

  const firstChapter = room.chapters[0];
  if (firstChapter.lessons && firstChapter.lessons.length > 0) {
    return firstChapter.lessons[0].id ?? null;
  }

  return null;
}

/**
 * Validates whether video URL requires native player (.mp4/.m3u8) or WebView.
 */
export function isNativeStream(url?: string | null): boolean {
  if (!url) return false;
  const cleanUrl = url.split('?')[0].toLowerCase();
  return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.m3u8');
}
