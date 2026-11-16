import React, { useMemo } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { CurriculumEditorScreen } from '../../../../src/screens/CurriculumEditorScreen';

export default function InstructorCourseCurriculum() {
  const { id } = useLocalSearchParams();

  const navigation = useMemo(() => ({
    goBack: () => router.back(),
    navigate: (screen, params) => {
      if (screen === 'CourseEdit') {
        router.push({
          pathname: '/(instructor)/courses/[id]/edit',
          params: { id: String(params?.courseId || id) },
        });
      }
    },
  }), [id]);

  return <CurriculumEditorScreen navigation={navigation} route={{ params: { courseId: Number(id) } }} />;
}
