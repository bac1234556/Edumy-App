// app/(tabs)/cart.tsx — Giỏ hàng đồng bộ (Read-only + Web Handoff theo BR-M01)
import React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Linking,
  RefreshControl,
} from 'react-native';
import { confirm, notify } from '../../src/lib/dialog';
import { useRouter } from 'expo-router';
import { useCart, useRemoveFromCart } from '../../src/features/cart/hooks';
import { CartItem, getUnavailableReasonInfo } from '../../src/features/cart/logic';
import { useFreeEnroll } from '../../src/features/catalog/hooks';
import { useSessionStore } from '../../src/store/session';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { Loading } from '../../src/components/ui/Loading';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { MoneyText } from '../../src/components/ui/MoneyText';
import { webLinks } from '../../src/lib/web-links';
import { AppError } from '../../src/api/problem';
import { Ionicons } from '@expo/vector-icons';
import { semantic, radius, monoFontFamily, microShadow } from '../../src/theme/tokens';

export default function CartScreen() {
  const router = useRouter();
  const { status } = useSessionStore();
  const isLoggedIn = status === 'authenticated';

  const { data: cart, isLoading, isError, error, refetch, isRefetching } = useCart();
  const { mutate: removeItem, isPending: isRemoving } = useRemoveFromCart();
  const { mutate: freeEnroll, isPending: isEnrolling } = useFreeEnroll();

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon={<Ionicons name="cart-outline" size={26} color={semantic.brandPrimary} />}
          title="Đăng nhập để đồng bộ giỏ hàng"
          description="Đăng nhập để xem các khóa học bạn đã lưu và đồng bộ tức thì cùng website Edumy."
          actionTitle="Đăng nhập"
          onAction={() => router.push('/(auth)/login')}
        />
      </View>
    );
  }

  if (isLoading) {
    return <Loading message="Đang đồng bộ giỏ hàng..." />;
  }

  if (isError) {
    return (
      <ErrorState
        message={error?.message || 'Không thể tải giỏ hàng'}
        onRetry={() => refetch()}
      />
    );
  }

  const items = cart?.items || [];

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon={<Ionicons name="cart-outline" size={26} color={semantic.brandPrimary} />}
          title="Giỏ hàng đang trống"
          description="Bạn chưa chọn khóa học nào. Hãy khám phá danh mục để thêm khóa học phù hợp."
          actionTitle="Khám phá khóa học"
          onAction={() => router.push('/')}
        />
      </View>
    );
  }

  const handleConfirmRemove = async (courseId: number, title: string) => {
    const ok = await confirm({
      title: 'Xác nhận xóa',
      message: `Bạn có chắc chắn muốn bỏ "${title}" khỏi giỏ hàng?`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      destructive: true,
    });
    if (!ok) return;
    removeItem(courseId, {
      onError: (err) => {
        const appErr = err as unknown as AppError;
        void notify('Lỗi', appErr.message || 'Không thể xóa khóa học khỏi giỏ hàng.');
      },
    });
  };

  const handleEnrollNow = (courseId: number) => {
    freeEnroll(courseId, {
      onSuccess: () => {
        refetch();
        router.push(`/learn/${courseId}` as const);
      },
      onError: (err) => {
        const appErr = err as unknown as AppError;
        void notify('Không thể ghi danh', appErr.message || 'Vui lòng thử lại sau.');
      },
    });
  };

  const handleOpenWebCart = () => {
    Linking.openURL(webLinks.cart());
  };

  const renderCartItem = ({ item }: { item: CartItem }) => {
    const reasonInfo = getUnavailableReasonInfo(item.unavailableReason);

    return (
      <View style={[styles.itemCard, microShadow]}>
        <View style={styles.itemMainRow}>
          {item.thumbnailUrl ? (
            <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
          ) : (
            <View style={styles.placeholderThumbnail}>
              <Ionicons name="layers-outline" size={22} color={semantic.brandPrimary} />
            </View>
          )}

          <View style={styles.itemInfo}>
            <TouchableOpacity onPress={() => router.push(`/courses/${item.slug}` as const)}>
              <Text numberOfLines={2} style={styles.itemTitle}>
                {item.title}
              </Text>
            </TouchableOpacity>

            <Text style={styles.instructorName}>
              GV: {item.instructor?.fullName || 'Chưa cập nhật'}
            </Text>

            <MoneyText
              amount={item.isFree ? 0 : item.price}
              style={styles.itemPrice}
            />
          </View>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleConfirmRemove(item.courseId, item.title)}
            disabled={isRemoving}
            accessibilityRole="button"
            accessibilityLabel="Xóa khỏi giỏ hàng"
          >
            <Ionicons name="trash-outline" size={18} color={semantic.danger} />
          </TouchableOpacity>
        </View>

        {/* Unavailable Reason Banner */}
        {reasonInfo && (
          <View style={styles.reasonBanner}>
            <Ionicons name="information-circle-outline" size={16} color="#B45309" />
            <Text style={styles.reasonText}>{reasonInfo.label}</Text>
            {reasonInfo.isNowFree && (
              <TouchableOpacity
                style={styles.enrollNowBtn}
                onPress={() => handleEnrollNow(item.courseId)}
                disabled={isEnrolling}
              >
                <Text style={styles.enrollNowText}>Ghi danh ngay</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.courseId)}
        ListHeaderComponent={
          <View style={styles.headerNoticeCard}>
            <Ionicons name="sync-outline" size={16} color={semantic.brandPrimary} />
            <Text style={styles.headerNoticeText}>
              Giỏ hàng được đồng bộ hai chiều theo thời gian thực với tài khoản Edumy trên Website.
            </Text>
          </View>
        }
        renderItem={renderCartItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      />

      {/* Sticky Bottom Summary — BR-M01 No In-App Checkout */}
      <View style={styles.bottomBar}>
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryOverline}>TỔNG CỘNG TẠM TÍNH</Text>
            <Text style={styles.summaryLabel}>
              {cart?.purchasableCount || 0} khóa học hợp lệ
            </Text>
          </View>
          <MoneyText
            amount={cart?.totalAmount || 0}
            style={styles.totalAmountText}
          />
        </View>

        <View style={styles.webNoticeBox}>
          <Ionicons name="globe-outline" size={14} color={semantic.textMuted} />
          <Text style={styles.webNotice}>
            Mở trình duyệt tới trang giỏ hàng trên Website Edumy để hoàn tất đăng ký khóa học (BR-M01).
          </Text>
        </View>

        <Button
          title="Mở website"
          onPress={handleOpenWebCart}
          icon={<Ionicons name="open-outline" size={16} color="#FFFFFF" />}
          style={styles.openWebButton}
        />
      </View>
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
    paddingBottom: 185,
  },
  headerNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: semantic.brandSoft,
    borderWidth: 1,
    borderColor: semantic.brandBorder,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 14,
  },
  headerNoticeText: {
    flex: 1,
    fontSize: 12,
    color: semantic.brandPrimaryStrong,
    lineHeight: 17,
  },
  itemCard: {
    backgroundColor: semantic.surfaceCard,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
  },
  itemMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 84,
    height: 58,
    borderRadius: radius.sm,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
  },
  placeholderThumbnail: {
    width: 84,
    height: 58,
    borderRadius: radius.sm,
    backgroundColor: semantic.surfaceSubtle,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: semantic.textPrimary,
    lineHeight: 19,
  },
  instructorName: {
    fontSize: 12,
    color: semantic.textMuted,
    marginTop: 3,
  },
  itemPrice: {
    fontSize: 14,
    color: semantic.brandPrimary,
    marginTop: 5,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: semantic.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  reasonBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 10,
    borderRadius: radius.sm,
    marginTop: 12,
  },
  reasonText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    marginLeft: 6,
    fontWeight: '500',
  },
  enrollNowBtn: {
    backgroundColor: semantic.brandPrimary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  enrollNowText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: semantic.surfaceCard,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: semantic.borderStrong,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryOverline: {
    fontSize: 10,
    fontWeight: '700',
    color: semantic.textMuted,
    letterSpacing: 0.7,
  },
  summaryLabel: {
    fontFamily: monoFontFamily,
    fontSize: 12,
    color: semantic.textSecondary,
    fontVariant: ['tabular-nums'],
    marginTop: 1,
  },
  totalAmountText: {
    fontSize: 20,
    fontWeight: '800',
    color: semantic.textPrimary,
  },
  webNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: semantic.surfaceCanvas,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    marginBottom: 10,
  },
  webNotice: {
    flex: 1,
    fontSize: 11,
    color: semantic.textSecondary,
    lineHeight: 16,
  },
  openWebButton: {
    backgroundColor: semantic.brandPrimary,
  },
});
