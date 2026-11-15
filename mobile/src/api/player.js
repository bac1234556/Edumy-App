import { api } from './client';
import { instructorApi } from './instructorApi';

// Giáo trình lấy từ API public của Course Detail; link video lấy qua API có kiểm tra quyền.
export async function fetchCourseCurriculum(courseId, role = 'STUDENT') {
  if (role === 'INSTRUCTOR') {
    const [courseResponse, sectionsResponse] = await Promise.all([
      instructorApi.getCourseDetail(courseId),
      instructorApi.getSections(courseId),
    ]);
    const sections = sectionsResponse.data?.data || [];
    const curriculum = await Promise.all(sections.map(async (section) => {
      const { data } = await instructorApi.getLessons(section.id);
      return {
        ...section,
        lessons: (data?.data || []).map((lesson) => ({
          ...lesson,
          durationSeconds: lesson.durationSec,
        })),
      };
    }));
    return { ...courseResponse.data?.data, curriculum };
  }

  const { data } = await api.get(`/courses/${courseId}`);
  return data.data;
}

export async function fetchLesson(courseId, lessonId) {
  const { data } = await api.get(`/learning/courses/${courseId}/lessons/${lessonId}`);
  return data.data;
}

export function fetchInstructorLesson(curriculum, lessonId) {
  const lesson = (curriculum || [])
    .flatMap((section) => section.lessons || [])
    .find((item) => Number(item.id) === Number(lessonId));
  if (!lesson) throw new Error('Không tìm thấy bài học trong khóa học này');
  return lesson;
}
