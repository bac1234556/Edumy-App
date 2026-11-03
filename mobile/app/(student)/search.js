import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { SearchScreen } from '../../src/screens/SearchScreen';

export default function SearchRoute() {
  const params = useLocalSearchParams();
  const navigation = {
    navigate: (screen, p) => {
      if (screen === 'CourseDetail') {
        router.push({
          pathname: '/(student)/courses/[id]',
          params: { id: p?.courseId || 1 },
        });
      }
    },
    goBack: () => router.back(),
  };

  return <SearchScreen navigation={navigation} route={{ params }} />;
}
