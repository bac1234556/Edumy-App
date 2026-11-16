import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { router, useNavigation } from 'expo-router';
import { Button } from 'react-native-paper';
import { MyCoursesScreen } from '../../src/screens/MyCoursesScreen';

export default function InstructorHome() {
  const stackNavigation = useNavigation();

  const navigation = useMemo(() => ({
    navigate: (screen, params) => {
      if (screen === 'Notifications') {
        router.push('/(instructor)/notifications');
        return;
      }
      if (screen === 'CurriculumEditor') {
        router.push({
          pathname: '/(instructor)/courses/[id]/curriculum',
          params: { id: String(params?.courseId) },
        });
        return;
      }
      if (screen === 'CourseEdit') {
        router.push({
          pathname: '/(instructor)/courses/[id]/edit',
          params: { id: String(params?.courseId) },
        });
      }
    },
    goBack: () => router.back(),
    // Tải lại danh sách khi quay về từ màn hình sửa khóa học.
    addListener: (event, callback) => stackNavigation.addListener(event, callback),
  }), [stackNavigation]);

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Button
          mode="outlined"
          compact
          onPress={() => navigation.navigate('Notifications')}
        >
          Thông báo
        </Button>
      </View>
      <MyCoursesScreen navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
