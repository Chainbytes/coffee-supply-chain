import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, fontSize, spacing } from '../theme';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
}

export default function EmptyState({
  icon = '📭',
  title,
  message,
}: EmptyStateProps): React.ReactElement {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
  },
  icon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.textMuted,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.lg,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.8,
  },
});
