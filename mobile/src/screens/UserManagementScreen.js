import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Alert,
} from 'react-native';
import { USERS_MOCK } from '../mock/adminMock';

const ROLES = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'STUDENT', label: 'Học viên' },
  { key: 'INSTRUCTOR', label: 'Giảng viên' },
  { key: 'ADMIN', label: 'Quản trị viên' },
];

/**
 * UserManagementScreen - Quản lý người dùng
 * Đáp ứng yêu cầu Issue [W7-E3]:
 * - Danh sách người dùng
 * - Ô tìm kiếm (theo Tên, Email)
 * - Chip Role lọc theo vai trò (STUDENT, INSTRUCTOR, ADMIN)
 * - Đủ 3 trạng thái: Loading / Empty / Error
 * - Hỗ trợ tương tác Khóa / Mở khóa tài khoản (mock toggle)
 */
export const UserManagementScreen = ({ navigation }) => {
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = () => {
    setIsLoading(true);
    setHasError(false);
    setTimeout(() => {
      setUsers(USERS_MOCK);
      setIsLoading(false);
      setRefreshing(false);
    }, 400);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  // Lọc người dùng theo Role và từ khóa tìm kiếm
  const filteredUsers = users.filter((u) => {
    const matchesRole = selectedRole === 'ALL' || u.role === selectedRole;
    const matchesQuery =
      !searchQuery.trim() ||
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesQuery;
  });

  // Xử lý chuyển đổi trạng thái Khóa / Mở khóa người dùng
  const handleToggleStatus = (userId) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) => {
        if (user.id === userId) {
          const newStatus = user.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
          return { ...user, status: newStatus };
        }
        return user;
      })
    );
  };

  // Render role badge với màu sắc đặc trưng
  const renderRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return (
          <View style={[styles.roleBadge, { backgroundColor: '#FEE2E2' }]}>
            <Text style={[styles.roleBadgeText, { color: '#DC2626' }]}>🛡️ Admin</Text>
          </View>
        );
      case 'INSTRUCTOR':
        return (
          <View style={[styles.roleBadge, { backgroundColor: '#F3E8FF' }]}>
            <Text style={[styles.roleBadgeText, { color: '#7E22CE' }]}>👨‍🏫 Giảng viên</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.roleBadge, { backgroundColor: '#EFF6FF' }]}>
            <Text style={[styles.roleBadgeText, { color: '#2563EB' }]}>👨‍🎓 Học viên</Text>
          </View>
        );
    }
  };

  // 1. Trạng thái Loading
  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.stateContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.stateText}>Đang tải danh sách người dùng...</Text>
      </SafeAreaView>
    );
  }

  // 2. Trạng thái Error
  if (hasError) {
    return (
      <SafeAreaView style={styles.stateContainer}>
        <Text style={styles.stateIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Lỗi tải dữ liệu người dùng</Text>
        <Text style={styles.stateText}>Không thể kết nối đến máy chủ. Vui lòng thử lại.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchUsers}>
          <Text style={styles.retryBtnText}>Thử lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Render từng dòng người dùng
  const renderUserItem = ({ item }) => {
    const isBlocked = item.status === 'BLOCKED';

    return (
      <View style={styles.userCard}>
        {/* Avatar */}
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitials}>
              {item.fullName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        {/* Thông tin chính */}
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName} numberOfLines={1}>
              {item.fullName}
            </Text>
          </View>

          <Text style={styles.userEmail} numberOfLines={1}>
            {item.email}
          </Text>

          {item.bio ? (
            <Text style={styles.userBio} numberOfLines={2}>
              {item.bio}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            {renderRoleBadge(item.role)}

            <View
              style={[
                styles.statusBadge,
                isBlocked ? styles.statusBlocked : styles.statusActive,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isBlocked ? '#EF4444' : '#10B981' },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: isBlocked ? '#DC2626' : '#059669' },
                ]}
              >
                {isBlocked ? 'Đã khóa' : 'Hoạt động'}
              </Text>
            </View>
          </View>
        </View>

        {/* Nút Khóa / Mở khóa */}
        <View style={styles.actionColumn}>
          <TouchableOpacity
            style={[
              styles.statusToggleBtn,
              isBlocked ? styles.btnUnlock : styles.btnLock,
            ]}
            onPress={() => handleToggleStatus(item.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.statusToggleText,
                isBlocked ? styles.textUnlock : styles.textLock,
              ]}
            >
              {isBlocked ? 'Mở' : 'Khóa'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation?.goBack?.()}
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnText}>‹ Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản Lý Người Dùng 👥</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Ô tìm kiếm */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo họ tên hoặc email..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Danh sách Chip Role */}
      <View style={styles.chipsWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={ROLES}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.chipsContainer}
          renderItem={({ item }) => {
            const isSelected = selectedRole === item.key;
            return (
              <TouchableOpacity
                style={[styles.roleChip, isSelected && styles.roleChipSelected]}
                onPress={() => setSelectedRole(item.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.roleChipText,
                    isSelected && styles.roleChipTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Thống kê số lượng kết quả */}
      <View style={styles.countBar}>
        <Text style={styles.countText}>
          Tìm thấy <Text style={styles.countBold}>{filteredUsers.length}</Text> tài khoản
        </Text>
      </View>

      {/* 3. Trạng thái Empty / Danh sách người dùng */}
      {filteredUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>Không tìm thấy tài khoản nào</Text>
          <Text style={styles.emptyDesc}>
            Không có người dùng nào khớp với bộ lọc role hoặc từ khóa "{searchQuery}".
          </Text>
          <TouchableOpacity
            style={styles.resetFilterBtn}
            onPress={() => {
              setSelectedRole('ALL');
              setSearchQuery('');
            }}
          >
            <Text style={styles.resetFilterText}>Xóa bộ lọc</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    paddingVertical: 6,
    paddingRight: 10,
  },
  backBtnText: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 0,
  },
  clearBtn: {
    fontSize: 14,
    color: '#94A3B8',
    padding: 4,
  },
  chipsWrapper: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  chipsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  roleChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  roleChipSelected: {
    backgroundColor: '#2563EB',
  },
  roleChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  roleChipTextSelected: {
    color: '#FFFFFF',
  },
  countBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  countText: {
    fontSize: 12,
    color: '#64748B',
  },
  countBold: {
    fontWeight: '700',
    color: '#1E293B',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  userCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E2E8F0',
  },
  avatarPlaceholder: {
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563EB',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  userEmail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  userBio: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 3,
    lineHeight: 15,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: '#ECFDF5',
  },
  statusBlocked: {
    backgroundColor: '#FEF2F2',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  actionColumn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  btnLock: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  btnUnlock: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statusToggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textLock: {
    color: '#E11D48',
  },
  textUnlock: {
    color: '#059669',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  resetFilterBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  resetFilterText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 13,
  },
  stateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  stateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  stateText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 8,
  },
  retryBtn: {
    marginTop: 18,
    backgroundColor: '#2563EB',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
