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
import { Badge } from '../../src/components/ui/Badge';
import { Loading } from '../../src/components/ui/Loading';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { formatDate } from '../../src/lib/date';
import { notify } from '../../src/lib/dialog';
import { layout, monoFontFamily, microShadow, radius, semantic } from '../../src/theme/tokens';

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
        error={error}
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
        <Badge
          variant="info"
          label="Chứng chỉ hoàn thành"
          icon={<Ionicons name="ribbon-outline" size={13} color={semantic.brandPrimary} />}
        />
        <View style={styles.codePill}>
          <Text style={styles.certCode}>#{item.code}</Text>
        </View>
      </View>

      <Text variant="h3" style={styles.courseTitle}>
        {item.courseTitle}
      </Text>

      <View style={styles.metaRow}>
        <Ionicons name="calendar-outline" size={14} color={semantic.textMuted} />
        <Text style={styles.infoLabel}>Ngày cấp:</Text>
        <Text style={styles.infoValueTabular}>{formatDate(item.issuedAt ?? '')}</Text>
      </View>

      <View style={styles.actionButtons}>
        <Button
          title={Platform.OS === 'web' ? 'Mở xác thực' : 'Tải PDF'}
          onPress={() => item.code && handleDownload(item.code, item.verifyUrl)}
          loading={isDownloading}
          disabled={isDownloading}
          icon={
            <Ionicons
              name={Platform.OS === 'web' ? 'open-outline' : 'download-outline'}
              size={16}
              color="#FFFFFF"
            />
          }
          style={styles.actionBtn}
        />

        <Button
          title="Sao chép link xác thực"
          variant="outline"
          onPress={() => item.code && handleCopy(item.code, item.verifyUrl)}
          style={styles.actionBtn}
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
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: semantic.surfaceCard,
    borderRadius: radius.card,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    borderLeftWidth: 4,
    borderLeftColor: semantic.brandPrimary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
    flexWrap: 'wrap',
  },
  codePill: {
    backgroundColor: semantic.surfaceMuted,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
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
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: semantic.surfaceMuted,
    marginBottom: 14,
  },
  infoLabel: {
    fontSize: 13,
    color: semantic.textMuted,
  },
  infoValueTabular: {
    fontFamily: monoFontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: semantic.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  actionBtn: {
    flex: 1,
    minWidth: 140,
  },
});
