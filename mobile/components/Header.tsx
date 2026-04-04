import React from 'react';
import { Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontFamily, fontSize, spacing } from '../theme';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

export default function Header({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightElement,
}: HeaderProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    insets.top > 0 ? insets.top : Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

  return (
    <View style={[styles.container, { paddingTop: statusBarHeight + spacing.md }]}>
      <View style={styles.row}>
        {showBack ? (
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [styles.sideSlot, { opacity: pressed ? 0.6 : 1 }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.backText}>{'‹'}</Text>
          </Pressable>
        ) : (
          <View style={styles.sideSlot} />
        )}

        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={[styles.sideSlot, styles.rightSlot]}>
          {rightElement ?? null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.coffeeDark,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sideSlot: {
    width: 36,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  rightSlot: {
    alignItems: 'flex-end',
  },
  backText: {
    color: colors.cream,
    fontSize: 28,
    lineHeight: 32,
    fontFamily: 'System',
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  title: {
    color: colors.cream,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    letterSpacing: 0.2,
  },
  subtitle: {
    color: colors.coffeeLight,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    opacity: 0.9,
  },
});
