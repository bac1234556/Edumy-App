import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { MyCoursesScreen } from '../../src/modules/instructor/screens/MyCoursesScreen';

export default function InstructorHome() {
  const navigation = {
    navigate: (screen, params) => {
      // route to instructor course form or course details
      console.log('Navigating to', screen, params);
    },
    goBack: () => router.back(),
  };

  return (
    <View style={{ flex: 1 }}>
      <MyCoursesScreen navigation={navigation} />
    </View>
  );
}
