// app/(tabs)/instructor.tsx — Kênh Giảng viên (5 phần: Tổng quan, Khóa học, Hỏi đáp, Thu nhập, Rút tiền)
import React, { useCallback, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  useCourseEarnings,
  useEarningsSummary,
  useInstructorCourses,
  useInstructorInvitations,
  useInstructorOverview,
  useMonthlyEarnings,
  useWithdrawals,
} from '../../src/features/instructor/hooks';
import { useRefetchOnScreenFocus } from '../../src/hooks/useRefetchOnScreenFocus';
import { useSessionStore } from '../../src/store/session';
import {
  InstructorTabKey,
  OverviewSection,
} from '../../src/features/instructor/components/OverviewSection';
import { CoursesSection } from '../../src/features/instructor/components/CoursesSection';
import { QuestionsSection } from '../../src/features/instructor/components/QuestionsSection';
import { EarningsSection } from '../../src/features/instructor/components/EarningsSection';
import { WithdrawalsSection } from '../../src/features/instructor/components/WithdrawalsSection';
import { Text } from '../../src/components/ui/Text';
import { ResponsiveContainer } from '../../src/components/ui/ResponsiveContainer';
import { layout, radius, semantic } from '../../src/theme/tokens';

const SEGMENTS: { key: InstructorTabKey; label: string }[] = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'courses', label: 'Khóa học' },
  { key: 'qa', label: 'Hỏi đáp' },
  { key: 'earnings', label: 'Thu nhập' },
  { key: 'withdrawals', label: 'Rút tiền' },
];

export default function InstructorTabScreen() {
  const { me } = useSessionStore();
  const [activeTab, setActiveTab] = useState<InstructorTabKey>('overview');

  const isInstructorRole = Boolean(
    me?.roles?.some((r) => typeof r === 'string' && r.toLowerCase() === 'instructor')
  );

  const overviewQuery = useInstructorOverview(isInstructorRole);
  const coursesQuery = useInstructorCourses(isInstructorRole && activeTab === 'courses');
  const invitationsQuery = useInstructorInvitations(isInstructorRole && activeTab === 'courses');

  const summaryQuery = useEarningsSummary();
  const courseEarningsQuery = useCourseEarnings();
  const monthlyQuery = useMonthlyEarnings();
  const withdrawalsQuery = useWithdrawals(0);

  const handleRefresh = useCallback(() => {
    void summaryQuery.refetch();
    void courseEarningsQuery.refetch();
    void monthlyQuery.refetch();
    void withdrawalsQuery.refetch();
    if (isInstructorRole) {
      void overviewQuery.refetch();
      if (activeTab === 'courses') {
        void coursesQuery.refetch();
        void invitationsQuery.refetch();
      }
    }
  }, [
    summaryQuery,
    courseEarningsQuery,
    monthlyQuery,
    withdrawalsQuery,
    isInstructorRole,
    overviewQuery,
    coursesQuery,
    invitationsQuery,
    activeTab,
  ]);

  useRefetchOnScreenFocus(handleRefresh);

  const isRefetching =
    overviewQuery.isRefetching ||
    summaryQuery.isRefetching ||
    coursesQuery.isRefetching;

  return (
    <View style={styles.container}>
      {/* Segmented Control Tab Bar */}
      <View style={styles.segmentWrapper}>
        <ResponsiveContainer maxWidth={layout.maxContentWidth}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.segmentRow}
          >
            {SEGMENTS.map((seg) => {
              const active = activeTab === seg.key;
              return (
                <TouchableOpacity
                  key={seg.key}
                  style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                  onPress={() => setActiveTab(seg.key)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                    {seg.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </ResponsiveContainer>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />}
      >
        <ResponsiveContainer maxWidth={layout.maxContentWidth}>
          {activeTab === 'overview' &&
            (isInstructorRole ? (
              <OverviewSection
                overview={overviewQuery.data}
                isLoading={overviewQuery.isLoading}
                isError={overviewQuery.isError}
                error={overviewQuery.error}
                errorMessage={overviewQuery.error?.message}
                onRetry={() => overviewQuery.refetch()}
                onNavigateTab={setActiveTab}
              />
            ) : (
              <EarningsSection
                summary={summaryQuery.data}
                courses={courseEarningsQuery.data}
                monthly={monthlyQuery.data}
                isLoading={summaryQuery.isLoading}
                isError={summaryQuery.isError}
                error={summaryQuery.error}
                errorMessage={summaryQuery.error?.message}
                onRetry={handleRefresh}
              />
            ))}

          {activeTab === 'courses' && (
            <CoursesSection
              courses={coursesQuery.data}
              invitations={invitationsQuery.data}
              isLoading={coursesQuery.isLoading || invitationsQuery.isLoading}
              isError={coursesQuery.isError}
              error={coursesQuery.error}
              errorMessage={coursesQuery.error?.message}
              onRetry={handleRefresh}
            />
          )}

          {activeTab === 'qa' && <QuestionsSection />}

          {activeTab === 'earnings' && (
            <EarningsSection
              summary={summaryQuery.data}
              courses={courseEarningsQuery.data}
              monthly={monthlyQuery.data}
              isLoading={summaryQuery.isLoading}
              isError={summaryQuery.isError}
              error={summaryQuery.error}
              errorMessage={summaryQuery.error?.message}
              onRetry={handleRefresh}
            />
          )}

          {activeTab === 'withdrawals' && (
            <WithdrawalsSection
              summary={summaryQuery.data}
              withdrawals={withdrawalsQuery.data?.content}
            />
          )}
        </ResponsiveContainer>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semantic.surfaceCanvas,
  },
  segmentWrapper: {
    backgroundColor: semantic.surfacePage,
    borderBottomWidth: 1,
    borderBottomColor: semantic.borderSubtle,
    paddingVertical: 10,
  },
  segmentRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  segmentBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: semantic.surfaceMuted,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    minHeight: 40,
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: semantic.brandPrimary,
    borderColor: semantic.brandPrimary,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
    color: semantic.textSecondary,
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
});
