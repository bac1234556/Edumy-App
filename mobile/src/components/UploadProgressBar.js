import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const UploadProgressBar = ({ progress, visible, statusText }) => {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.textRow}>
        <Text style={styles.statusText}>{statusText || 'Đang tải lên...'}</Text>
        <Text style={styles.percentText}>{progress}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.bar, { width: `${progress}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  textRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statusText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  percentText: { fontSize: 13, color: '#2563EB', fontWeight: '700' },
  track: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 4,
  },
});