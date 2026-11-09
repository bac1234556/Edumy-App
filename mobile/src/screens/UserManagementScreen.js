import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { errorMessage } from '../api/client';
import { fetchAdminUsers, updateAdminUserStatus } from '../api/adminManagement';
import { useAuthStore } from '../store/authStore';

const ROLES = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'STUDENT', label: 'Học viên' },
  { key: 'INSTRUCTOR', label: 'Giảng viên' },
  { key: 'ADMIN', label: 'Quản trị viên' },
];
const PAGE_SIZE = 20;

export const UserManagementScreen = ({ navigation }) => {
  const adminId = useAuthStore((state) => state.session?.user?.id);
  const requestId = useRef(0);
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [searchText, setSearchText] = useState('');
  const [keyword, setKeyword] = useState('');
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
  const [updatingUsers, setUpdatingUsers] = useState({});

  const loadUsers = useCallback(async (page = 0, append = false) => {
    const request = ++requestId.current;
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setError('');
    }

    try {
      const result = await fetchAdminUsers({
        page,
        size: PAGE_SIZE,
        sort: 'createdAt,desc',
        ...(keyword ? { keyword } : {}),
        ...(selectedRole !== 'ALL' ? { role: selectedRole } : {}),
      });
      if (request !== requestId.current) return;
      setUsers((current) => append ? [...current, ...result.content] : result.content);
      setTotalUsers(result.totalElements);
      setHasMore(!result.last);
      setError('');
    } catch (loadError) {
      if (request === requestId.current) setError(errorMessage(loadError));
    } finally {
      if (request === requestId.current) {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    }
  }, [keyword, selectedRole]);

  useEffect(() => {
    const timer = setTimeout(() => loadUsers(), 250);
    return () => {
      clearTimeout(timer);
      requestId.current += 1;
    };
  }, [loadUsers]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadUsers();
  };

  const loadNextPage = () => {
    if (!isLoading && !isLoadingMore && hasMore) {
      return loadUsers(Math.ceil(users.length / PAGE_SIZE), true);
    }
    return undefined;
  };

  const toggleStatus = async (user) => {
    const status = user.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    setUpdatingUsers((current) => ({ ...current, [user.id]: true }));
    try {
      const updated = await updateAdminUserStatus(user.id, status);
      setUsers((current) => current.map((item) => item.id === user.id ? updated : item));
    } catch (updateError) {
      Alert.alert('Không thể cập nhật trạng thái', errorMessage(updateError));
    } finally {
      setUpdatingUsers((current) => ({ ...current, [user.id]: false }));
    }
  };

  const renderUser = ({ item }) => {
    const isActive = item.status === 'ACTIVE';
    const isCurrentAdmin = Number(item.id) === Number(adminId);
    return (
      <View style={styles.userCard}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitial}>{(item.fullName || item.email || '?').charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>{item.fullName || 'Chưa cập nhật tên'}</Text>
          <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.role}>{ROLES.find((role) => role.key === item.role)?.label || item.role}</Text>
            <Text style={[styles.status, isActive ? styles.active : styles.locked]}>
              {isActive ? 'Hoạt động' : 'Đã khóa'}
            </Text>
          </View>
        </View>
        <Switch
          accessibilityRole="switch"
          accessibilityLabel={`${isActive ? 'Khóa' : 'Mở khóa'} tài khoản ${item.email}`}
          value={isActive}
          disabled={isCurrentAdmin || Boolean(updatingUsers[item.id])}
          onValueChange={() => toggleStatus(item)}
          trackColor={{ false: '#FCA5A5', true: '#86EFAC' }}
        />
      </View>
    );
  };

  if (isLoading && users.length === 0 && !error) {
    return (
      <SafeAreaView style={styles.stateContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.stateText}>Đang tải danh sách người dùng...</Text>
      </SafeAreaView>
    );
  }

  if (error && users.length === 0) {
    return (
      <SafeAreaView style={styles.stateContainer}>
        <Text style={styles.errorTitle}>Không tải được danh sách người dùng</Text>
        <Text style={styles.stateText}>{error}</Text>
        <Pressable style={styles.primaryButton} onPress={() => loadUsers()}>
          <Text style={styles.primaryButtonText}>Thử lại</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={() => navigation?.goBack?.()}>
          <Text style={styles.backButton}>‹ Quay lại</Text>
        </Pressable>
        <Text style={styles.title}>Quản lý người dùng</Text>
        <View style={styles.headerSpacer} />
      </View>

      <TextInput
        accessibilityLabel="Tìm kiếm người dùng"
        style={styles.searchInput}
        placeholder="Tìm theo họ tên hoặc email..."
        value={searchText}
        onChangeText={(text) => {
          setSearchText(text);
          setKeyword(text.trim());
        }}
      />
      <View style={styles.roleList}>
        {ROLES.map((role) => (
          <Pressable
            key={role.key}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedRole === role.key }}
            style={[styles.roleChip, selectedRole === role.key && styles.roleChipSelected]}
            onPress={() => setSelectedRole(role.key)}
          >
            <Text style={[styles.roleChipText, selectedRole === role.key && styles.roleChipTextSelected]}>
              {role.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.countText}>Tìm thấy {totalUsers} tài khoản</Text>
      {error ? <Text accessibilityRole="alert" style={styles.inlineError}>{error}</Text> : null}
      <FlatList
        testID="users-list"
        data={users}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderUser}
        contentContainerStyle={styles.listContent}
        onEndReached={loadNextPage}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={(
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Không tìm thấy tài khoản nào</Text>
            <Text style={styles.stateText}>Thử thay đổi từ khóa hoặc bộ lọc vai trò.</Text>
          </View>
        )}
        ListFooterComponent={isLoadingMore ? <ActivityIndicator style={styles.footer} color="#2563EB" /> : null}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  backButton: { color: '#2563EB', fontSize: 16, fontWeight: '600' },
  title: { color: '#0F172A', fontSize: 17, fontWeight: '700' },
  headerSpacer: { width: 70 },
  searchInput: {
    margin: 16, marginBottom: 10, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10, backgroundColor: '#FFFFFF', color: '#0F172A',
  },
  roleList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  roleChip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 18, backgroundColor: '#E2E8F0' },
  roleChipSelected: { backgroundColor: '#2563EB' },
  roleChipText: { color: '#475569', fontSize: 13, fontWeight: '600' },
  roleChipTextSelected: { color: '#FFFFFF' },
  countText: { paddingHorizontal: 16, paddingBottom: 8, color: '#64748B', fontSize: 13 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 },
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10,
    padding: 12, borderRadius: 12, backgroundColor: '#FFFFFF',
  },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#E2E8F0' },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#DBEAFE' },
  avatarInitial: { color: '#2563EB', fontSize: 18, fontWeight: '700' },
  userInfo: { flex: 1 },
  userName: { color: '#0F172A', fontSize: 14, fontWeight: '700' },
  email: { marginTop: 2, color: '#64748B', fontSize: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  role: { color: '#475569', fontSize: 11 },
  status: { fontSize: 11, fontWeight: '600' },
  active: { color: '#059669' },
  locked: { color: '#DC2626' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  emptyTitle: { color: '#1E293B', fontSize: 16, fontWeight: '700' },
  stateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F8FAFC' },
  stateText: { marginTop: 8, color: '#64748B', textAlign: 'center' },
  errorTitle: { color: '#1E293B', fontSize: 17, fontWeight: '700', textAlign: 'center' },
  inlineError: { marginHorizontal: 16, marginBottom: 8, color: '#B91C1C' },
  primaryButton: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, backgroundColor: '#2563EB' },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700' },
  footer: { padding: 16 },
});
