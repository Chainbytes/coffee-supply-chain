import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';

export interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
}

export default function ScreenContainer({
  children,
  style,
  backgroundColor = colors.surface,
}: ScreenContainerProps): React.ReactElement {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }, style]} edges={['bottom', 'left', 'right']}>
      <StatusBar style="light" />
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
