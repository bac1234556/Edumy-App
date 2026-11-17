// app/account/certificates.tsx — Danh sách chứng chỉ số (Technical Credential Cards)
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
import { useRefetchOnScreenFocus } from '../../src/hooks/useRefetchOnScreenFocus';
import { CertificateItem } from '../../src/features/certificates/logic';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { Loading } from '../../src/components/ui/Loading';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { formatDate } from '../../src/lib/date';
import { Ionicons } from '@expo/vector-icons';
import { semantic, radius, monoFontFamily, microShadow } from '../../src/theme/tokens';

export default function CertificatesScreen() {
  const router = useRouter();
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, error, refetch, isRefetching } = useCertificates(page);
  useRefetchOnScreenFocus(refetch);
  const { downloadAndShare, isDownloading, copyVerificationLink } = useCertificateActions();

  const certificates = data?.content || [];

  if (isLoading) {
    return <Loading message="Đang tải hồ sơ chứng chỉ số..." />;
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
        Alert.alert('Đã sao chép', 'Liên kết xác thực chứng chỉ công khai đã được lưu vào bộ nhớ tạm.');
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
    <View style={[styles.card, microShadow]}>
      <View style={styles.cardHeader}>
        <View style={styles.badge}>
          <Ionicons name="ribbon-outline" size={14} color={semantic.brandPrimaryStrong} />
          <Text style={styles.badgeText}>CHỨNG CHỈ HOÀN THÀNH</Text>
        </View>
        <View style={styles.codePill}>
          <Text style={styles.certCode}>#{item.code}</Text>
        </View>
      </View>

      <Text variant="h3" style={styles.courseTitle}>
        {item.courseTitle}
      </Text>

      <View style={styles.metaGrid}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={14} color={semantic.textMuted} />
          <Text style={styles.infoLabel}>Ngày cấp:</Text>
          <Text style={styles.infoValueTabular}>{formatDate(item.issuedAt ?? '')}</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <Button
          title="Tải PDF & Chia sẻ"
          onPress={() => item.code && handleDownload(item.code)}
          loading={isDownloading}
          icon={<Ionicons name="share-outline" size={16} color="#FFFFFF" />}
          style={styles.downloadBtn}
        />

        <Button
          title="Sao chép link"
          variant="outline"
          onPress={() => item.code && handleCopy(item.code)}
          style={styles.copyBtn}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Chứng chỉ tốt nghiệp', headerBackTitle: 'Quay lại' }} />

      {certificates.length === 0 ? (
        <EmptyState
          icon={<Ionicons name="ribbon-outline" size={26} color={semantic.brandPrimary} />}
          title="Chưa có chứng chỉ nào"
          description="Hoàn thành 100% các bài học trong một khóa học để được hệ thống tự động cấp chứng chỉ số PDF."
          actionTitle="Vào phòng học"
          onAction={() => router.push('/(tabs)/my-learning')}
        />
      ) : (
        <FlatList
          data={certificates}
          keyExtractor={(item, idx) => item.code ?? String(item.courseId ?? idx)}
          renderItem={renderCertCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          onEndReached={() => {
            if (data?.page && page + 1 < (data.page.totalPages ?? 0)) {
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
    backgroundColor: semantic.surfaceCanvas,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: semantic.surfaceCard,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
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
    gap: 5,
    backgroundColor: semantic.brandSoft,
    borderWidth: 1,
    borderColor: semantic.brandBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: semantic.brandPrimaryStrong,
    letterSpacing: 0.7,
  },
  codePill: {
    backgroundColor: semantic.surfaceCanvas,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
  },
  certCode: {
    fontFamily: monoFontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: semantic.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  courseTitle: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
    color: semantic.textPrimary,
  },
  metaGrid: {
    backgroundColor: semantic.surfaceCanvas,
    borderRadius: radius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: semantic.textMuted,
    width: 72,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: semantic.textPrimary,
    flex: 1,
  },
  infoValueTabular: {
    fontFamily: monoFontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: semantic.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  downloadBtn: {
    flex: 1.4,
    minHeight: 42,
    paddingHorizontal: 12,
  },
  copyBtn: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: 10,
  },
});
