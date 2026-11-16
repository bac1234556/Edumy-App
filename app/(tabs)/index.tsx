// app/(tabs)/index.tsx — Khám phá (Catalog)
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from '../../src/components/ui/Text';
import { ENV } from '../../src/config/env';

export default function CatalogScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="h1">Khám phá khóa học</Text>
        <Text variant="bodySmall" style={styles.subtitle}>
          Nâng cao kỹ năng với các khóa học thực chiến chất lượng cao
        </Text>
      </View>

      <View style={styles.statusCard}>
        <Text variant="label" style={styles.statusTitle}>
          Kết nối Backend Edumy
        </Text>
        <Text variant="bodySmall" style={styles.statusText}>
          API Base URL: {ENV.API_BASE_URL}
        </Text>
        <Text variant="bodySmall" style={styles.statusText}>
          Web Base URL: {ENV.WEB_BASE_URL}
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
  },
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusTitle: {
    color: '#0D9488',
    marginBottom: 6,
  },
  statusText: {
    color: '#475569',
    marginTop: 2,
    fontFamily: 'monospace',
  },
});
