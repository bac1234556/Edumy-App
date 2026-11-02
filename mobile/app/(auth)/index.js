import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text } from 'react-native-paper';
import { router } from 'expo-router';
import { HealthCard } from '../../src/components/HealthCard';

export default function Welcome() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <Text variant="displaySmall">Edumy</Text>
        <Text variant="titleLarge">Học hôm nay, vững bước ngày mai.</Text>
        <Text>Khám phá kiến thức và phát triển kỹ năng cùng giảng viên Edumy.</Text>
        <HealthCard />
        <Button mode="contained" onPress={() => router.push('/(auth)/login')}>Đăng nhập</Button>
        <Button mode="outlined" onPress={() => router.push('/(auth)/register')}>Tạo tài khoản</Button>
      </ScrollView>
    </SafeAreaView>
  );
}
