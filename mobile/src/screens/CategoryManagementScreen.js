import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  createCategory,
  fetchAdminCategories,
  updateCategory,
} from '../api/adminManagement';
import { errorMessage } from '../api/client';

const EMPTY_FORM = { name: '', slug: '', icon: '', description: '' };

export const CategoryManagementScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoadError('');
    try {
      const result = await fetchAdminCategories();
      setCategories(result);
    } catch (error) {
      setLoadError(errorMessage(error));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const openCreateForm = () => {
    setEditingCategory(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setIsModalVisible(true);
  };

  const openEditForm = (category) => {
    setEditingCategory(category);
    setForm({
      name: category.name || '',
      slug: category.slug || '',
      icon: category.icon || '',
      description: category.description || '',
    });
    setFormError('');
    setIsModalVisible(true);
  };

  const saveCategory = async () => {
    const name = form.name.trim();
    if (!name) {
      setFormError('Vui lòng nhập tên danh mục.');
      return;
    }

    setIsSaving(true);
    setFormError('');
    const payload = {
      name,
      slug: form.slug.trim() || null,
      icon: form.icon.trim() || null,
      description: form.description.trim() || null,
      parentId: editingCategory?.parentId ?? null,
    };
    try {
      const saved = editingCategory
        ? await updateCategory(editingCategory.id, payload)
        : await createCategory(payload);
      setCategories((current) => {
        const updated = editingCategory
          ? current.map((category) => category.id === saved.id ? saved : category)
          : [...current, saved];
        return updated.sort((left, right) => left.name.localeCompare(right.name, 'vi'));
      });
      setIsModalVisible(false);
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadCategories();
  };

  const retryLoading = () => {
    setIsLoading(true);
    loadCategories();
  };

  const renderCategory = ({ item }) => (
    <View style={styles.categoryCard}>
      <View style={styles.categoryDetails}>
        <Text style={styles.categoryName}>{item.name}</Text>
        <Text style={styles.categorySlug}>{item.slug}</Text>
        {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
        <Text style={styles.courseCount}>{item.courseCount || 0} khóa học</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Chỉnh sửa ${item.name}`}
        style={styles.editButton}
        onPress={() => openEditForm(item)}
      >
        <Text style={styles.editButtonText}>Sửa</Text>
      </Pressable>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.stateContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.stateText}>Đang tải danh mục...</Text>
      </SafeAreaView>
    );
  }

  if (loadError && categories.length === 0) {
    return (
      <SafeAreaView style={styles.stateContainer}>
        <Text style={styles.errorTitle}>Không tải được danh mục</Text>
        <Text style={styles.stateText}>{loadError}</Text>
        <Pressable style={styles.primaryButton} onPress={retryLoading}>
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
        <Text style={styles.title}>Quản lý danh mục</Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.toolbar}>
        <Text style={styles.countText}>{categories.length} danh mục</Text>
        <Pressable accessibilityRole="button" style={styles.primaryButton} onPress={openCreateForm}>
          <Text style={styles.primaryButtonText}>+ Thêm danh mục</Text>
        </Pressable>
      </View>
      {loadError ? <Text accessibilityRole="alert" style={styles.inlineError}>{loadError}</Text> : null}
      <FlatList
        data={categories}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderCategory}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={(
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Chưa có danh mục nào</Text>
            <Text style={styles.stateText}>Tạo danh mục để học viên có thể lọc khóa học.</Text>
          </View>
        )}
      />
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingCategory ? 'Chỉnh sửa danh mục' : 'Tạo danh mục'}
            </Text>
            <TextInput
              accessibilityLabel="Tên danh mục"
              style={styles.formInput}
              placeholder="Tên danh mục *"
              value={form.name}
              onChangeText={(name) => setForm((current) => ({ ...current, name }))}
              maxLength={100}
            />
            <TextInput
              accessibilityLabel="Slug danh mục"
              style={styles.formInput}
              placeholder="Slug (tự tạo nếu để trống)"
              value={form.slug}
              onChangeText={(slug) => setForm((current) => ({ ...current, slug }))}
              maxLength={120}
              autoCapitalize="none"
            />
            <TextInput
              accessibilityLabel="Icon danh mục"
              style={styles.formInput}
              placeholder="Icon"
              value={form.icon}
              onChangeText={(icon) => setForm((current) => ({ ...current, icon }))}
              maxLength={100}
            />
            <TextInput
              accessibilityLabel="Mô tả danh mục"
              style={[styles.formInput, styles.multilineInput]}
              placeholder="Mô tả"
              value={form.description}
              onChangeText={(description) => setForm((current) => ({ ...current, description }))}
              maxLength={500}
              multiline
            />
            {formError ? <Text accessibilityRole="alert" style={styles.inlineError}>{formError}</Text> : null}
            <View style={styles.formActions}>
              <Pressable
                accessibilityRole="button"
                style={styles.cancelButton}
                disabled={isSaving}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                style={[styles.primaryButton, isSaving && styles.disabledButton]}
                disabled={isSaving}
                onPress={saveCategory}
              >
                {isSaving
                  ? <ActivityIndicator color="#FFFFFF" />
                  : <Text style={styles.primaryButtonText}>Lưu</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  countText: { color: '#64748B', fontSize: 13 },
  listContent: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 24 },
  categoryCard: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 10, padding: 14,
    borderRadius: 12, backgroundColor: '#FFFFFF',
  },
  categoryDetails: { flex: 1, marginRight: 12 },
  categoryName: { color: '#0F172A', fontSize: 15, fontWeight: '700' },
  categorySlug: { marginTop: 3, color: '#64748B', fontSize: 12 },
  description: { marginTop: 5, color: '#475569', fontSize: 13 },
  courseCount: { marginTop: 6, color: '#64748B', fontSize: 11 },
  editButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#EFF6FF' },
  editButtonText: { color: '#2563EB', fontWeight: '700' },
  stateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F8FAFC' },
  stateText: { marginTop: 8, color: '#64748B', textAlign: 'center' },
  errorTitle: { color: '#1E293B', fontSize: 17, fontWeight: '700' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  emptyTitle: { color: '#1E293B', fontSize: 16, fontWeight: '700' },
  primaryButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#2563EB' },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700' },
  inlineError: { marginHorizontal: 16, marginBottom: 8, color: '#B91C1C' },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#00000066' },
  modalCard: { padding: 20, borderRadius: 14, backgroundColor: '#FFFFFF' },
  modalTitle: { marginBottom: 14, color: '#0F172A', fontSize: 18, fontWeight: '700' },
  formInput: {
    marginBottom: 10, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, color: '#0F172A',
  },
  multilineInput: { minHeight: 76, textAlignVertical: 'top' },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginTop: 8 },
  cancelButton: { paddingHorizontal: 14, paddingVertical: 10 },
  cancelButtonText: { color: '#475569', fontWeight: '600' },
  disabledButton: { opacity: 0.6 },
});
