import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { CourseDetailScreen } from './src/screens/CourseDetailScreen';

/**
 * App Root Component: Hỗ trợ chuyển đổi màn hình mượt mà giữa Home và CourseDetail
 * theo đúng tiêu chí Acceptance Criteria của Issue [W7-B3].
 */
export default function App() {
  const [currentScreen, setCurrentScreen] = useState('Home');
  const [currentParams, setCurrentParams] = useState({ courseId: 1 });

  const navigation = {
    navigate: (screenName, params = {}) => {
      setCurrentParams(params);
      setCurrentScreen(screenName);
    },
    goBack: () => {
      setCurrentScreen('Home');
    },
  };

  return (
    <View style={styles.container}>
      {currentScreen === 'Home' && (
        <HomeScreen navigation={navigation} />
      )}
      {currentScreen === 'CourseDetail' && (
        <CourseDetailScreen
          navigation={navigation}
          route={{ params: currentParams }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
