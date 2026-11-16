// app/(tabs)/cart.tsx — Giỏ hàng (Read-only + Checkout on Web theo BR-M01)
import React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
  RefreshControl,
} from 'react-native';
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
          icon={<Ionicons name="cart-outline" size={56} color="#94A3B8" />}
          title="Đăng nhập để xem giỏ hàng"
          description="Đăng nhập để xem các khóa học bạn đã thêm vào giỏ hàng và đồng bộ cùng website."
          actionTitle="Đăng nhập"
          onAction={() => router.push('/(auth)/login')}
        />
      </View>
    );
  }

  if (isLoading) {
    return <Loading message="Đang tải giỏ hàng..." />;
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
          icon={<Ionicons name="cart-outline" size={56} color="#94A3B8" />}
          title="Giỏ hàng trống"
          description="Bạn chưa chọn khóa học nào. Hãy khám phá danh mục để chọn khóa học phù hợp."
          actionTitle="Khám phá khóa học"
          onAction={() => router.push('/')}
        />
      </View>
    );
  }

  const handleConfirmRemove = (courseId: number, title: string) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn bỏ "${title}" khỏi giỏ hàng?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            removeItem(courseId, {
              onError: (err) => {
                const appErr = err as unknown as AppError;
                Alert.alert('Lỗi', appErr.message || 'Không thể xóa khóa học khỏi giỏ hàng.');
              },
            });
          },
        },
      ]
    );
  };

  const handleEnrollNow = (courseId: number) => {
    freeEnroll(courseId, {
      onSuccess: () => {
        refetch();
        router.push(`/learn/${courseId}` as const);
      },
      onError: (err) => {
        const appErr = err as unknown as AppError;
        Alert.alert('Không thể ghi danh', appErr.message || 'Vui lòng thử lại sau.');
      },
    });
  };

  const handleOpenWebCart = () => {
    Linking.openURL(webLinks.cart());
  };

  const renderCartItem = ({ item }: { item: CartItem }) => {
    const reasonInfo = getUnavailableReasonInfo(item.unavailableReason);

    return (
      <View style={styles.itemCard}>
        <View style={styles.itemMainRow}>
          {item.thumbnailUrl ? (
            <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
          ) : (
            <View style={styles.placeholderThumbnail}>
              <Ionicons name="school-outline" size={24} color="#0D9488" />
            </View>
          )}

          <View style={styles.itemInfo}>
            <TouchableOpacity onPress={() => router.push(`/courses/${item.slug}` as const)}>
              <Text numberOfLines={2} style={styles.itemTitle}>
                {item.title}
              </Text>
            </TouchableOpacity>

            <Text style={styles.instructorName}>
              Giảng viên: {item.instructor?.fullName || 'Chưa cập nhật'}
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
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Unavailable Reason Banner */}
        {reasonInfo && (
          <View style={styles.reasonBanner}>
            <Ionicons name="alert-circle-outline" size={16} color="#B45309" />
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
        renderItem={renderCartItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      />

      {/* Sticky Bottom Summary — BR-M01 No In-App Checkout */}
      <View style={styles.bottomBar}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            Tổng cộng ({cart?.purchasableCount || 0} khóa học mua được):
          </Text>
          <MoneyText
            amount={cart?.totalAmount || 0}
            style={styles.totalAmountText}
          />
        </View>

        <Text style={styles.webNotice}>
          Vui lòng truy cập website để tiến hành thanh toán
        </Text>

        <Button
          title="Mở website"
          onPress={handleOpenWebCart}
          style={styles.openWebButton}
        />
      </View>
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
    paddingBottom: 140,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 80,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  placeholderThumbnail: {
    width: 80,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#E6FFFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 18,
  },
  instructorName: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D9488',
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 6,
  },
  reasonBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
  },
  reasonText: {
    flex: 1,
    fontSize: 12,
    color: '#B45309',
    marginLeft: 6,
  },
  enrollNowBtn: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  enrollNowText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#475569',
  },
  totalAmountText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  webNotice: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 10,
  },
  openWebButton: {
    backgroundColor: '#0D9488',
  },
});
