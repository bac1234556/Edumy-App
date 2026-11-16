// src/components/ui/Screen.tsx
import React from 'react';
import { View, StyleSheet, ViewStyle, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  safe?: boolean;
}

export function Screen({ children, style, safe = true }: ScreenProps) {
  const Container = safe ? SafeAreaView : View;
  return (
    <Container style={[styles.container, style]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6', // Editorial warm canvas
  },
});
