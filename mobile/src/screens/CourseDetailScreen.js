import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { RatingStars } from '../components/common/RatingStars';
import { PriceTag } from '../components/common/PriceTag';
import { COURSES_MOCK } from '../mock/coursesMock';
import { api } from '../api/client';

export const CourseDetailScreen = ({ route, navigation }) => {
  const courseId = route?.params?.courseId || 1;
  const [course, setCourse] = useState(() => COURSES_MOCK.find((c) => c.id === courseId) || COURSES_MOCK[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [expandedSections, setExpandedSections] = useState({ 1: true });
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Video Preview Modal state
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewLesson, setPreviewLesson] = useState(null);

  const fetchCourseDetail = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await api.get(`/courses/${courseId}`);
      if (res?.data?.data) {
        setCourse(res.data.data);
      } else {
        const fallback = COURSES_MOCK.find((c) => c.id === courseId) || COURSES_MOCK[0];
        setCourse(fallback);
      }
    } catch {
      const fallback = COURSES_MOCK.find((c) => c.id === courseId) || COURSES_MOCK[0];
      setCourse(fallback);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourseDetail();
  }, [fetchCourseDetail]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCourseDetail();
  };

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleOpenPreview = (lesson) => {
    if (lesson) {
      if (!lesson.isPreview) {
        Alert.alert('Nội dung bị khóa', 'Vui lòng đăng ký khóa học để học bài học này.');
        return;
      }
      setPreviewLesson(lesson);
      setPreviewModalVisible(true);
      return;
    }

    // Find first previewable lesson or use promo video
    let firstPreview = null;
    if (course.curriculum) {
      for (const section of course.curriculum) {
        firstPreview = section.lessons?.find((l) => l.isPreview);
        if (firstPreview) break;
      }
    }

    setPreviewLesson(firstPreview || {
      id: 0,
      title: 'Giới thiệu tổng quan khóa học (Preview)',
      duration: '03:45',
      videoUrl: course.previewVideoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    });
    setPreviewModalVisible(true);
  };

  const handleEnrollPress = () => {
    if (navigation && navigation.navigate) {
      navigation.navigate('Checkout', { courseId: course.id });
    } else {
      Alert.alert(
        'Đăng ký khóa học',
        `Chuyển đến thanh toán khóa học "${course.title}".`
      );
    }
  };

  const totalLessonsCount = course.curriculum?.reduce(
    (acc, s) => acc + (s.lessons?.length || 0),
    0
  ) || 0;

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.stateContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.stateText}>Đang tải thông tin khóa học...</Text>
      </SafeAreaView>
    );
  }

  if (hasError && !course) {
    return (
      <SafeAreaView style={styles.stateContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Không thể tải thông tin khóa học</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchCourseDetail}>
          <Text style={styles.retryBtnText}>Thử lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Top Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (navigation && navigation.goBack ? navigation.goBack() : null)}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          {course.title || 'Chi tiết khóa học'}
        </Text>
        <TouchableOpacity
          style={styles.navWishlistBtn}
          onPress={() => setIsWishlisted(!isWishlisted)}
        >
          <Text style={[styles.navHeart, isWishlisted && styles.navHeartActive]}>
            {isWishlisted ? '♥' : '♡'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />}
      >
        {/* Video Preview Banner */}
        <TouchableOpacity
          style={styles.previewBanner}
          activeOpacity={0.9}
          onPress={() => handleOpenPreview(null)}
        >
          <Image
            source={{ uri: course.thumbnailUrl }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.playOverlay}>
            <View style={styles.playBtn}>
              <Text style={styles.playIcon}>▶</Text>
            </View>
            <Text style={styles.playText}>Xem trước khóa học (Preview)</Text>
          </View>
        </TouchableOpacity>

        {/* Course Header Info */}
        <View style={styles.infoSection}>
          <View style={styles.badgeRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{course.categoryName}</Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>{course.level}</Text>
            </View>
          </View>

          <Text style={styles.title}>{course.title}</Text>
          <Text style={styles.subtitle}>{course.subtitle}</Text>

          <View style={styles.statsRow}>
            <RatingStars
              rating={course.averageRating}
              totalReviews={course.totalReviews}
              size={15}
            />
            <Text style={styles.statDot}>•</Text>
            <Text style={styles.studentCount}>
              👥 {course.totalStudents?.toLocaleString('vi-VN')} học viên
            </Text>
          </View>
        </View>

        {/* Instructor Card */}
        <View style={styles.instructorCard}>
          <Image
            source={{ uri: course.instructor?.avatarUrl }}
            style={styles.instructorAvatar}
          />
          <View style={styles.instructorInfo}>
            <Text style={styles.instructorLabel}>Giảng viên hướng dẫn</Text>
            <Text style={styles.instructorName}>{course.instructor?.fullName}</Text>
            <Text style={styles.instructorBio} numberOfLines={2}>
              {course.instructor?.bio}
            </Text>
          </View>
        </View>

        {/* Description Section */}
        <View style={styles.contentSection}>
          <Text style={styles.sectionHeading}>Mô tả khóa học</Text>
          <Text style={styles.descriptionText}>{course.description}</Text>
        </View>

        {/* Curriculum Accordion Section */}
        <View style={styles.contentSection}>
          <View style={styles.curriculumHeader}>
            <Text style={styles.sectionHeading}>Giáo trình khóa học</Text>
            <Text style={styles.curriculumStats}>
              {course.curriculum?.length || 0} chương • {totalLessonsCount} bài học
            </Text>
          </View>

          {course.curriculum?.map((section) => {
            const isExpanded = !!expandedSections[section.id];
            return (
              <View key={section.id} style={styles.sectionAccordion}>
                {/* Accordion Header */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.accordionToggle}
                  onPress={() => toggleSection(section.id)}
                >
                  <View style={styles.accordionHeaderLeft}>
                    <Text style={styles.accordionIcon}>
                      {isExpanded ? '▼' : '►'}
                    </Text>
                    <Text style={styles.accordionTitle}>
                      {section.title}
                    </Text>
                  </View>
                  <Text style={styles.accordionCount}>
                    {section.lessons?.length || 0} bài
                  </Text>
                </TouchableOpacity>

                {/* Lessons List in Accordion */}
                {isExpanded && (
                  <View style={styles.lessonsList}>
                    {section.lessons?.map((lesson) => (
                      <TouchableOpacity
                        key={lesson.id}
                        style={styles.lessonItem}
                        activeOpacity={lesson.isPreview ? 0.7 : 1}
                        onPress={() => handleOpenPreview(lesson)}
                      >
                        <View style={styles.lessonLeft}>
                          <Text style={[styles.lessonStatusIcon, !lesson.isPreview && styles.lessonLockedIcon]}>
                            {lesson.isPreview ? '▶' : '🔒'}
                          </Text>
                          <View style={styles.lessonTitleWrapper}>
                            <Text style={styles.lessonTitle}>
                              {lesson.title}
                            </Text>
                            <Text style={styles.lessonDuration}>
                              {lesson.duration}
                            </Text>
                          </View>
                        </View>
                        {lesson.isPreview && (
                          <View style={styles.previewTag}>
                            <Text style={styles.previewTagText}>Xem thử</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Video Preview Modal */}
      <Modal
        visible={previewModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPreviewModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {previewLesson?.title || 'Xem thử bài học'}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setPreviewModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Simulated Player View */}
            <View style={styles.playerContainer}>
              <Image
                source={{ uri: course.thumbnailUrl }}
                style={styles.playerPoster}
                resizeMode="cover"
              />
              <View style={styles.playerControlsOverlay}>
                <View style={styles.playerCenterBtn}>
                  <Text style={styles.playerPlayIcon}>▶</Text>
                </View>
                <Text style={styles.playerDurationText}>
                  Thời lượng bài học: {previewLesson?.duration || '05:00'}
                </Text>
              </View>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLessonHeading}>Nội dung xem trước (Free Preview)</Text>
              <Text style={styles.modalLessonSub}>
                Bạn đang xem thử bài học miễn phí thuộc khóa học "{course.title}". Đăng ký toàn bộ khóa học để truy cập đầy đủ bài tập và chứng chỉ tốt nghiệp.
              </Text>
              <TouchableOpacity
                style={styles.modalEnrollBtn}
                onPress={() => {
                  setPreviewModalVisible(false);
                  handleEnrollPress();
                }}
              >
                <Text style={styles.modalEnrollBtnText}>
                  {course.price === 0 ? 'VÀO HỌC NGAY' : 'ĐĂNG KÝ KHÓA HỌC NGAY'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sticky Bottom Bar with CTA */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceCol}>
          <Text style={styles.bottomPriceLabel}>Học phí trọn đời</Text>
          <PriceTag price={course.price} originalPrice={course.originalPrice} size="large" />
        </View>
        <TouchableOpacity
          style={styles.enrollBtn}
          activeOpacity={0.85}
          onPress={handleEnrollPress}
        >
          <Text style={styles.enrollBtnText}>
            {course.price === 0 ? 'VÀO HỌC NGAY' : 'ĐĂNG KÝ HỌC'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  stateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  stateText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  errorIcon: {
    fontSize: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0F172A',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  navTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  navWishlistBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navHeart: {
    fontSize: 20,
    color: '#94A3B8',
  },
  navHeartActive: {
    color: '#EF4444',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  previewBanner: {
    width: '100%',
    height: 220,
    backgroundColor: '#000000',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    opacity: 0.7,
  },
  playOverlay: {
    position: 'absolute',
    alignItems: 'center',
  },
  playBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(37, 99, 235, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  playIcon: {
    color: '#FFFFFF',
    fontSize: 22,
    marginLeft: 3,
  },
  playText: {
    color: '#FFFFFF',
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '700',
  },
  levelBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  levelBadgeText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginTop: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  statDot: {
    color: '#CBD5E1',
  },
  studentCount: {
    fontSize: 13,
    color: '#64748B',
  },
  instructorCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    gap: 14,
  },
  instructorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  instructorInfo: {
    flex: 1,
  },
  instructorLabel: {
    fontSize: 11,
    color: '#94A3B8',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  instructorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  instructorBio: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 16,
  },
  contentSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  descriptionText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
    marginTop: 8,
  },
  curriculumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  curriculumStats: {
    fontSize: 12,
    color: '#64748B',
  },
  sectionAccordion: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  accordionToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 14,
  },
  accordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  accordionIcon: {
    fontSize: 12,
    color: '#64748B',
  },
  accordionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  accordionCount: {
    fontSize: 12,
    color: '#64748B',
  },
  lessonsList: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  lessonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  lessonStatusIcon: {
    fontSize: 14,
    color: '#2563EB',
  },
  lessonLockedIcon: {
    color: '#94A3B8',
  },
  lessonTitleWrapper: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  lessonDuration: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  previewTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  previewTagText: {
    color: '#2563EB',
    fontSize: 10,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 12,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: 'bold',
  },
  playerContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#000000',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerPoster: {
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  playerControlsOverlay: {
    position: 'absolute',
    alignItems: 'center',
  },
  playerCenterBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(37, 99, 235, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  playerPlayIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    marginLeft: 2,
  },
  playerDurationText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
  modalBody: {
    padding: 18,
  },
  modalLessonHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  modalLessonSub: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 16,
  },
  modalEnrollBtn: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalEnrollBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 8,
  },
  bottomPriceCol: {
    flex: 1,
  },
  bottomPriceLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  enrollBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  enrollBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
