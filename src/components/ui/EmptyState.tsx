// src/components/ui/EmptyState.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { semantic, radius } from '../../theme/tokens';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionTitle?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  actionTitle,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.box}>
        <View style={styles.iconFrame}>
          {icon || <Ionicons name="folder-open-outline" size={26} color={semantic.brandPrimary} />}
        </View>
        <Text style={styles.title}>{title}</Text>
        {Boolean(description) && <Text style={styles.description}>{description}</Text>}
        {actionTitle && onAction && (
          <Button
            title={actionTitle}
            onPress={onAction}
            style={styles.actionButton}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  box: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: semantic.surfaceCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    padding: 24,
    alignItems: 'center',
  },
  iconFrame: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: semantic.brandSoft,
    borderWidth: 1,
    borderColor: semantic.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: semantic.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 13,
    color: semantic.textSecondary,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 19,
  },
  actionButton: {
    marginTop: 18,
    minWidth: 160,
  },
});
