// src/components/ui/Screen.tsx
import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { semantic } from '../../theme/tokens';

interface ScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  safe?: boolean;
}

export function Screen({ children, style, safe = true }: ScreenProps) {
  const Container = safe ? SafeAreaView : View;
  return (
    <Container style={[styles.container, style]}>
      <StatusBar barStyle="dark-content" backgroundColor={semantic.surfaceCanvas} />
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semantic.surfaceCanvas,
  },
});
