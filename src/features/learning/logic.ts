// src/features/learning/logic.ts
// Pure business logic for Learning room, progress, and lesson navigation.

import { components } from '../../api/schema';

export type Enrollment = components['schemas']['Enrollment'];
export type CourseLearnRoom = components['schemas']['CourseLearnRoom'];
export type LessonDetail = components['schemas']['LessonDetail'];
export type LessonCompletionResponse = components['schemas']['LessonCompletionResponse'];

/**
 * Finds the first uncompleted lesson in the course outline,
 * or falls back to the first available lesson in the first chapter.
 */
export function resolveFirstOrUncompletedLesson(room: CourseLearnRoom): number | null {
  if (!room.chapters || room.chapters.length === 0) return null;

  // First pass: find the first lesson where completed === false
  for (const chapter of room.chapters) {
    for (const lesson of chapter.lessons) {
      if (!lesson.completed) {
        return lesson.id;
      }
    }
  }

  // Fallback: first lesson of the first chapter
  const firstChapter = room.chapters[0];
  if (firstChapter.lessons && firstChapter.lessons.length > 0) {
    return firstChapter.lessons[0].id;
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
