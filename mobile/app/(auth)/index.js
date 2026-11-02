import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { HealthCard } from '../../src/components/HealthCard';

export default function Welcome() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <Text variant="displaySmall">Edumy</Text>
        <Text variant="titleLarge">Học hôm nay, vững bước ngày mai.</Text>
        <Text>Khám phá kiến thức và phát triển kỹ năng cùng giảng viên Edumy.</Text>
        <HealthCard />
      </ScrollView>
    </SafeAreaView>
  );
}
