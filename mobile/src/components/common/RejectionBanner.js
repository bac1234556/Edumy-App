import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function RejectionBanner({ reason }) {
  const reasonText = reason && reason.trim() ? reason.trim() : 'Quản trị viên chưa ghi rõ lý do.';

  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Text style={styles.title}>Khóa học bị từ chối</Text>
      <Text style={styles.reason}>{`Lý do: ${reasonText}`}</Text>
      <Text style={styles.hint}>Hãy chỉnh sửa theo góp ý rồi gửi duyệt lại.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FEE2E2',
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    padding: 12,
  },
  title: { fontSize: 14, fontWeight: '700', color: '#991B1B' },
  reason: { fontSize: 13, color: '#7F1D1D', marginTop: 4 },
  hint: { fontSize: 12, color: '#991B1B', marginTop: 6 },
});
