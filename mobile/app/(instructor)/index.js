import React from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Button } from 'react-native-paper';
import { MyCoursesScreen } from '../../src/modules/instructor/screens/MyCoursesScreen';

export default function InstructorHome() {
  const navigation = {
    navigate: (screen, params) => {
      if (screen === 'Notifications') {
        router.push('/(instructor)/notifications');
        return;
      }
      // route to instructor course form or course details
      console.log('Navigating to', screen, params);
    },
    goBack: () => router.back(),
  };

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
