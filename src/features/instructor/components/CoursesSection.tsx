// src/features/instructor/components/CoursesSection.tsx
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CoInstructorInvitation, InstructorCourse } from '../api';
import { useAcceptInvitation, useDeclineInvitation } from '../hooks';
import { getCourseStatusInfo } from '../logic';
import { Text } from '../../../components/ui/Text';
import { Button } from '../../../components/ui/Button';
import { Badge, BadgeVariant } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { MoneyText } from '../../../components/ui/MoneyText';
import { Loading } from '../../../components/ui/Loading';
import { ErrorState } from '../../../components/ui/ErrorState';
import { EmptyState } from '../../../components/ui/EmptyState';
import { confirm, notify } from '../../../lib/dialog';
import { AppError } from '../../../api/problem';
import { microShadow, radius, semantic } from '../../../theme/tokens';

interface CoursesSectionProps {
  courses?: InstructorCourse[];
  invitations?: CoInstructorInvitation[];
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  errorMessage?: string;
  onRetry: () => void;
}

function mapCourseStatusVariant(status?: string): BadgeVariant {
  switch (status?.toLowerCase()) {
    case 'published':
      return 'success';
    case 'pendingapproval':
    case 'pending_approval':
    case 'pending':
      return 'warning';
    case 'rejected':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function CoursesSection({
  courses,
  invitations,
  isLoading,
  isError,
  error,
  errorMessage,
  onRetry,
}: CoursesSectionProps) {
  const router = useRouter();
  const { mutate: acceptInv, isPending: isAccepting } = useAcceptInvitation();
  const { mutate: declineInv, isPending: isDeclining } = useDeclineInvitation();

  if (isLoading) {
    return <Loading message="Đang tải khóa học giảng dạy..." />;
  }

  if (isError) {
    return (
      <ErrorState
        error={error}
        message={errorMessage || 'Không thể tải danh sách khóa học giảng viên.'}
        onRetry={onRetry}
      />
    );
  }

  const pendingInvitations = (invitations ?? []).filter(
    (inv) => inv.status?.toUpperCase() === 'INVITED'
  );

  const handleAccept = async (inv: CoInstructorInvitation) => {
    const id = inv.invitationId ?? inv.id;
    if (id === undefined) return;
    const sharePct = ((inv.shareBps ?? 0) / 100).toFixed(0);
    const ok = await confirm({
      title: 'Chấp nhận lời mời đồng giảng viên',
      message: `Xác nhận tham gia đồng giảng viên khóa "${inv.courseTitle ?? ''}" (tỷ lệ chia ${sharePct}%)?`,
      confirmText: 'Chấp nhận',
      cancelText: 'Hủy',
    });
    if (!ok) return;

    acceptInv(id, {
      onSuccess: () => {
        void notify('Thành công', 'Bạn đã chấp nhận lời mời đồng giảng viên.');
      },
      onError: (err) => {
        const appErr = err as unknown as AppError;
        void notify('Lỗi', appErr.message || 'Không thể chấp nhận lời mời.');
      },
    });
  };

  const handleDecline = async (inv: CoInstructorInvitation) => {
    const id = inv.invitationId ?? inv.id;
    if (id === undefined) return;
    const ok = await confirm({
      title: 'Từ chối lời mời',
      message: `Bạn có chắc muốn từ chối lời mời cộng tác khóa "${inv.courseTitle ?? ''}"?`,
      confirmText: 'Từ chối',
      cancelText: 'Hủy',
      destructive: true,
    });
    if (!ok) return;

    declineInv(id, {
      onSuccess: () => {
        void notify('Đã từ chối', 'Lời mời đồng giảng viên đã được từ chối.');
      },
      onError: (err) => {
        const appErr = err as unknown as AppError;
        void notify('Lỗi', appErr.message || 'Không thể từ chối lời mời.');
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Pending Co-instructor Invitations */}
      {pendingInvitations.length > 0 && (
        <View style={styles.sectionBlock}>
          <Text variant="h3" style={styles.sectionTitle}>
            Lời mời đồng giảng viên ({pendingInvitations.length})
          </Text>
          {pendingInvitations.map((inv) => {
            const sharePct = ((inv.shareBps ?? 0) / 100).toFixed(0);
            return (
              <Card key={inv.id} style={styles.inviteCard}>
                <Text style={styles.inviteTitle}>{inv.courseTitle}</Text>
                <Text style={styles.inviteShare}>Tỷ lệ chia thu nhập: {sharePct}%</Text>
                <View style={styles.inviteActions}>
                  <Button
                    title="Chấp nhận"
                    onPress={() => handleAccept(inv)}
                    disabled={isAccepting || isDeclining}
                    loading={isAccepting}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Từ chối"
                    variant="outline"
                    onPress={() => handleDecline(inv)}
                    disabled={isAccepting || isDeclining}
                    loading={isDeclining}
                    style={{ flex: 1 }}
                  />
                </View>
              </Card>
            );
          })}
        </View>
      )}

      {/* Courses List */}
      <View style={styles.sectionBlock}>
        <Text variant="h3" style={styles.sectionTitle}>
          Khóa học của bạn ({courses?.length ?? 0})
        </Text>

        {!courses || courses.length === 0 ? (
          <EmptyState
            icon={<Ionicons name="library-outline" size={26} color={semantic.brandPrimary} />}
            title="Chưa có khóa học nào"
            description="Bạn chưa tạo hoặc cộng tác khóa học nào trên Edumy."
          />
        ) : (
          courses.map((c) => {
            const statusInfo = getCourseStatusInfo(c.status);
            const isMain = c.role?.toLowerCase() === 'main';
            const sharePct = ((c.shareBps ?? 0) / 100).toFixed(0);

            return (
              <TouchableOpacity
                key={c.courseId}
                style={[styles.courseCard, microShadow]}
                onPress={() => {
                  if (c.courseId) {
                    router.push({
                      pathname: '/instructor/courses/[courseId]/students',
                      params: {
                        courseId: String(c.courseId),
                        title: c.title ?? '',
                      },
                    });
                  }
                }}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Xem học viên khóa ${c.title ?? ''}`}
              >
                <View style={styles.courseRow}>
                  {c.thumbnailUrl ? (
                    <Image source={{ uri: c.thumbnailUrl }} style={styles.thumb} />
                  ) : (
                    <View style={styles.thumbPlaceholder}>
                      <Ionicons name="book-outline" size={22} color={semantic.brandPrimary} />
                    </View>
                  )}

                  <View style={styles.courseBody}>
                    <View style={styles.badgeLine}>
                      <Badge
                        label={statusInfo.label}
                        variant={mapCourseStatusVariant(c.status)}
                      />
                      <Text style={styles.roleText}>
                        {isMain ? 'Chính' : 'Đồng GV'} · {sharePct}%
                      </Text>
                    </View>

                    <Text numberOfLines={2} style={styles.courseTitle}>
                      {c.title}
                    </Text>

                    <View style={styles.metricsRow}>
                      <Text style={styles.metricText}>{c.students ?? 0} học viên</Text>
                      <Text style={styles.metricDot}>·</Text>
                      <Ionicons name="star" size={12} color={semantic.ratingStar} />
                      <Text style={styles.metricText}>
                        {c.averageRating ? c.averageRating.toFixed(1) : '—'} ({c.ratingCount ?? 0})
                      </Text>
                    </View>

                    <View style={styles.earningRow}>
                      <Text style={styles.earningLabel}>Thu nhập thực nhận:</Text>
                      <MoneyText amount={c.netEarnings ?? 0} style={styles.earningVal} />
                    </View>
                  </View>

                  <Ionicons name="chevron-forward" size={18} color={semantic.textPlaceholder} />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  sectionBlock: {
    gap: 10,
  },
  sectionTitle: {
    marginBottom: 2,
  },
  inviteCard: {
    backgroundColor: semantic.warningSoft,
    borderColor: semantic.warningBorder,
  },
  inviteTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: semantic.textPrimary,
    marginBottom: 4,
  },
  inviteShare: {
    fontSize: 12,
    color: semantic.warning,
    marginBottom: 12,
    fontVariant: ['tabular-nums'],
  },
  inviteActions: {
    flexDirection: 'row',
    gap: 10,
  },
  courseCard: {
    backgroundColor: semantic.surfaceCard,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    padding: 14,
  },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumb: {
    width: 76,
    height: 56,
    borderRadius: radius.btn,
    backgroundColor: semantic.surfaceMuted,
  },
  thumbPlaceholder: {
    width: 76,
    height: 56,
    borderRadius: radius.btn,
    backgroundColor: semantic.brandSoft,
    borderWidth: 1,
    borderColor: semantic.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseBody: {
    flex: 1,
  },
  badgeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
    flexWrap: 'wrap',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: semantic.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: semantic.textPrimary,
    marginBottom: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  metricText: {
    fontSize: 12,
    color: semantic.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  metricDot: {
    fontSize: 12,
    color: semantic.textMuted,
  },
  earningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  earningLabel: {
    fontSize: 12,
    color: semantic.textMuted,
  },
  earningVal: {
    fontSize: 13,
    fontWeight: '700',
    color: semantic.brandPrimary,
  },
});
