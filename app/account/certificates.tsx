// app/account/certificates.tsx — Danh sách chứng chỉ của tôi
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useCertificates, useCertificateActions } from '../../src/features/certificates/hooks';
import { CertificateItem } from '../../src/features/certificates/logic';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { Loading } from '../../src/components/ui/Loading';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { formatDate } from '../../src/lib/date';
import { Ionicons } from '@expo/vector-icons';

export default function CertificatesScreen() {
  const router = useRouter();
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, error, refetch, isRefetching } = useCertificates(page);
  const { downloadAndShare, isDownloading, copyVerificationLink } = useCertificateActions();

  const certificates = data?.content || [];

  if (isLoading) {
    return <Loading message="Đang tải chứng chỉ..." />;
  }

  if (isError) {
    return (
      <ErrorState
        message={error?.message || 'Không thể tải danh sách chứng chỉ.'}
        onRetry={() => refetch()}
      />
    );
  }

  const handleCopy = (code: string) => {
    copyVerificationLink(code, {
      onSuccess: () => {
        Alert.alert('Thành công', 'Đã sao chép liên kết xác minh chứng chỉ vào bộ nhớ tạm.');
      },
      onError: () => {
        Alert.alert('Lỗi', 'Không thể sao chép liên kết.');
      },
    });
  };

  const handleDownload = (code: string) => {
    downloadAndShare(code, {
      onError: (err) => {
        Alert.alert('Tải chứng chỉ', err.message || 'Không thể tải tệp PDF chứng chỉ.');
      },
    });
  };

  const renderCertCard = ({ item }: { item: CertificateItem }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.badge}>
          <Ionicons name="ribbon" size={18} color="#0D9488" />
          <Text style={styles.badgeText}>CHỨNG CHỈ TỐT NGHIỆP</Text>
        </View>
        <Text style={styles.certCode}>{item.certificateCode}</Text>
      </View>

      <Text variant="h3" style={styles.courseTitle}>
        {item.courseTitle}
      </Text>

      <View style={styles.infoRow}>
        <Ionicons name="person-outline" size={14} color="#64748B" />
        <Text style={styles.infoText}>Học viên: {item.studentName}</Text>
      </View>

      {item.instructorName && (
        <View style={styles.infoRow}>
          <Ionicons name="school-outline" size={14} color="#64748B" />
          <Text style={styles.infoText}>Giảng viên: {item.instructorName}</Text>
        </View>
      )}

      <View style={styles.infoRow}>
        <Ionicons name="calendar-outline" size={14} color="#64748B" />
        <Text style={styles.infoText}>Cấp ngày: {formatDate(item.issuedAt)}</Text>
      </View>

      <View style={styles.actionButtons}>
        <Button
          title="Tải PDF & Chia sẻ"
          onPress={() => handleDownload(item.certificateCode)}
          loading={isDownloading}
          style={styles.downloadBtn}
        />

        <Button
          title="Sao chép link"
          variant="outline"
          onPress={() => handleCopy(item.certificateCode)}
          style={styles.copyBtn}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Chứng chỉ của tôi', headerBackTitle: 'Quay lại' }} />

      {certificates.length === 0 ? (
        <EmptyState
          icon={<Ionicons name="ribbon-outline" size={56} color="#94A3B8" />}
          title="Chưa có chứng chỉ"
          description="Hoàn thành tất cả các bài học trong một khóa học để nhận chứng chỉ tốt nghiệp chính thức từ Edumy."
          actionTitle="Vào phòng học"
          onAction={() => router.push('/(tabs)/my-learning')}
        />
      ) : (
        <FlatList
          data={certificates}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderCertCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          onEndReached={() => {
            if (data?.page && page + 1 < data.page.totalPages) {
              setPage((prev) => prev + 1);
            }
          }}
          onEndReachedThreshold={0.4}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6FFFA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D9488',
    letterSpacing: 0.5,
  },
  certCode: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    fontVariant: ['tabular-nums'],
  },
  courseTitle: {
    color: '#0F172A',
    marginBottom: 10,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#475569',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  downloadBtn: {
    flex: 1,
  },
  copyBtn: {
    flex: 1,
  },
});
