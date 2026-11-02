import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { CourseDetailScreen } from './src/screens/CourseDetailScreen';
import { AdminDashboardScreen } from './src/screens/AdminDashboardScreen';
import { UserManagementScreen } from './src/screens/UserManagementScreen';

/**
 * App Root Component:
 * Hỗ trợ chuyển đổi giữa các màn hình chính của ứng dụng:
 * 1. Home (W7-B3)
 * 2. CourseDetail (W7-B3)
 * 3. AdminDashboard (W7-E3)
 * 4. UserManagement (W7-E3)
 */
export default function App() {
  const [currentScreen, setCurrentScreen] = useState('AdminDashboard');
  const [currentParams, setCurrentParams] = useState({ courseId: 1 });

  const navigation = {
    navigate: (screenName, params = {}) => {
      setCurrentParams(params);
      setCurrentScreen(screenName);
    },
    goBack: () => {
      if (currentScreen === 'UserManagement') {
        setCurrentScreen('AdminDashboard');
      } else {
        setCurrentScreen('Home');
      }
    },
  };

  const navItems = [
    { key: 'Home', label: 'Trang chủ', icon: '🏠' },
    { key: 'CourseDetail', label: 'Khóa học', icon: '📚' },
    { key: 'AdminDashboard', label: 'Admin', icon: '🛡️' },
    { key: 'UserManagement', label: 'Users', icon: '👥' },
  ];

  return (
    <View style={styles.container}>
      {/* Screen Body */}
      <View style={styles.screenArea}>
        {currentScreen === 'Home' && <HomeScreen navigation={navigation} />}
        {currentScreen === 'CourseDetail' && (
          <CourseDetailScreen
            navigation={navigation}
            route={{ params: currentParams }}
          />
        )}
        {currentScreen === 'AdminDashboard' && (
          <AdminDashboardScreen navigation={navigation} />
        )}
        {currentScreen === 'UserManagement' && (
          <UserManagementScreen navigation={navigation} />
        )}
      </View>

      {/* Quick Navigation Bottom Bar dành cho Kiểm thử & Trình diễn */}
      <SafeAreaView style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          {navItems.map((item) => {
            const isActive = currentScreen === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.navTab, isActive && styles.navTabActive]}
                onPress={() => navigation.navigate(item.key)}
                activeOpacity={0.7}
              >
                <Text style={styles.navIcon}>{item.icon}</Text>
                <Text
                  style={[
                    styles.navLabel,
                    isActive && styles.navLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  screenArea: {
    flex: 1,
  },
  bottomNavContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  navTab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  navTabActive: {
    backgroundColor: '#EFF6FF',
  },
  navIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  navLabelActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
});
