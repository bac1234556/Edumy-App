import { instructorApi } from '../api/instructorApi';
import { api } from '../api/client';
import { fetchCourseCurriculum, fetchInstructorLesson } from '../api/player';

jest.mock('../api/client', () => ({ api: { get: jest.fn() } }));
jest.mock('../api/instructorApi', () => ({
  instructorApi: {
    getCourseDetail: jest.fn(),
    getSections: jest.fn(),
    getLessons: jest.fn(),
  },
}));

describe('player API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads instructor-owned sections and lessons for the instructor player', async () => {
    instructorApi.getCourseDetail.mockResolvedValue({ data: { data: { id: 7, instructorId: 2, title: 'Course' } } });
    instructorApi.getSections.mockResolvedValue({ data: { data: [{ id: 10, title: 'Section' }] } });
    instructorApi.getLessons.mockResolvedValue({
      data: { data: [{ id: 11, title: 'Lesson', videoUrl: 'https://cdn/video.mp4', durationSec: 60 }] },
    });

    const course = await fetchCourseCurriculum(7, 'INSTRUCTOR');

    expect(instructorApi.getCourseDetail).toHaveBeenCalledWith(7);
    expect(instructorApi.getSections).toHaveBeenCalledWith(7);
    expect(instructorApi.getLessons).toHaveBeenCalledWith(10);
    expect(course.curriculum[0].lessons[0]).toMatchObject({
      id: 11,
      durationSeconds: 60,
      videoUrl: 'https://cdn/video.mp4',
    });
    expect(fetchInstructorLesson(course.curriculum, 11).title).toBe('Lesson');
  });

  it('continues to load student curriculum through the course API', async () => {
    api.get.mockResolvedValue({ data: { data: { id: 7, curriculum: [] } } });

    await expect(fetchCourseCurriculum(7)).resolves.toEqual({ id: 7, curriculum: [] });
    expect(api.get).toHaveBeenCalledWith('/courses/7');
  });

  it('reports an invalid lesson when it is not in the instructor course', () => {
    expect(() => fetchInstructorLesson([], 404)).toThrow('Không tìm thấy bài học trong khóa học này');
  });
});
