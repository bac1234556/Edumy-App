// app/account/certificates.tsx — Danh sách chứng chỉ số (Paginated + PDF/Verify)
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useCertificateActions,
  useInfiniteCertificates,
} from '../../src/features/certificates/hooks';
import { useRefetchOnScreenFocus } from '../../src/hooks/useRefetchOnScreenFocus';
import { CertificateItem } from '../../src/features/certificates/logic';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { Loading } from '../../src/components/ui/Loading';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { formatDate } from '../../src/lib/date';
import { notify } from '../../src/lib/dialog';
import { monoFontFamily, microShadow, radius, semantic } from '../../src/theme/tokens';

export default function CertificatesScreen() {
  const router = useRouter();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteCertificates();
  useRefetchOnScreenFocus(refetch);
  const { downloadAndShare, isDownloading, copyVerificationLink } = useCertificateActions();

  const certificates = data?.pages.flatMap((p) => p.content ?? []) ?? [];

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

  const handleCopy = (code: string, verifyUrl?: string | null) => {
    copyVerificationLink(
      { code, verifyUrl },
      {
        onSuccess: () => {
          void notify(
            'Đã sao chép',
            'Liên kết xác thực chứng chỉ công khai đã được lưu vào bộ nhớ tạm.'
          );
        },
        onError: () => {
          void notify('Lỗi', 'Không thể sao chép liên kết.');
        },
      }
    );
  };

  const handleDownload = (code: string, verifyUrl?: string | null) => {
    downloadAndShare(
      { code, verifyUrl },
      {
        onError: (err) => {
          void notify('Tải chứng chỉ', err.message || 'Không thể tải tệp PDF chứng chỉ.');
        },
      }
    );
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
          title={Platform.OS === 'web' ? 'Mở xác thực' : 'Tải PDF'}
          onPress={() => item.code && handleDownload(item.code, item.verifyUrl)}
          loading={isDownloading}
          icon={
            <Ionicons
              name={Platform.OS === 'web' ? 'open-outline' : 'share-outline'}
              size={16}
              color="#FFFFFF"
            />
          }
          style={styles.downloadBtn}
        />

        <Button
          title="Sao chép link xác thực"
          variant="outline"
          onPress={() => item.code && handleCopy(item.code, item.verifyUrl)}
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
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator style={{ paddingVertical: 16 }} color={semantic.brandPrimary} />
            ) : null
          }
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
    borderRadius: radius.lg,
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
    gap: 8,
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
    borderRadius: 5,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: semantic.brandPrimaryStrong,
    letterSpacing: 0.6,
  },
  codePill: {
    backgroundColor: semantic.surfaceSubtle,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  certCode: {
    fontFamily: monoFontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: semantic.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  courseTitle: {
    fontSize: 17,
    lineHeight: 23,
    color: semantic.textPrimary,
    marginBottom: 12,
  },
  metaGrid: {
    backgroundColor: semantic.surfaceCanvas,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    padding: 10,
    gap: 7,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: semantic.textMuted,
  },
  infoValueTabular: {
    fontFamily: monoFontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: semantic.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  downloadBtn: {
    flex: 1,
  },
  copyBtn: {
    flex: 1,
  },
});
