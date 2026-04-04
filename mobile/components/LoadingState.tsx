import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, fontSize, spacing } from '../theme';

export interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message }: LoadingStateProps): React.ReactElement {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.forest} />
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
    gap: spacing.lg,
  },
  message: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
});
