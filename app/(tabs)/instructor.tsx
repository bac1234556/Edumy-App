// app/(tabs)/instructor.tsx — Chế độ thu nhập giảng viên (Instructor Money Mode)
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from '../../src/components/ui/Text';
import { useSessionStore } from '../../src/store/session';
import { Ionicons } from '@expo/vector-icons';

export default function InstructorTabScreen() {
  const { me } = useSessionStore();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="h1">Thu nhập Giảng viên</Text>
        <Text variant="bodySmall" style={styles.subtitle}>
          Kênh theo dõi doanh thu và yêu cầu quyết toán của bạn
        </Text>
      </View>

      <View style={styles.card}>
        <Ionicons name="wallet-outline" size={36} color="#0D9488" />
        <Text variant="h3" style={styles.cardTitle}>
          Chào mừng giảng viên {me?.fullName}
        </Text>
        <Text variant="bodySmall" style={styles.cardDesc}>
          Phân hệ báo cáo chi tiết thu nhập từng khóa học và số dư khả dụng sẽ được kích hoạt tại chặng M08 & M09.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  subtitle: {
    marginTop: 6,
    color: '#64748B',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    textAlign: 'center',
  },
  cardTitle: {
    marginTop: 12,
    textAlign: 'center',
  },
  cardDesc: {
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    color: '#64748B',
  },
});
