import React, { useMemo } from 'react';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { CourseEditScreen } from '../../../../src/screens/CourseEditScreen';

export default function InstructorCourseEdit() {
  const { id } = useLocalSearchParams();
  const stackNavigation = useNavigation();

  const navigation = useMemo(() => ({
    goBack: () => router.back(),
    navigate: (screen, params) => {
      if (screen === 'CurriculumEditor') {
        router.push({
          pathname: '/(instructor)/courses/[id]/curriculum',
          params: { id: String(params?.courseId || id) },
        });
      }
    },
    // Tải lại khóa học khi quay về từ màn hình curriculum (ví dụ vừa gửi duyệt lại).
    addListener: (event, callback) => stackNavigation.addListener(event, callback),
  }), [id, stackNavigation]);

  return <CourseEditScreen navigation={navigation} route={{ params: { courseId: Number(id) } }} />;
}
