import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, fontFamily, fontSize, radius, shadow, spacing } from '../theme';

export interface CardProps {
  title?: string;
  titleColor?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  bodyStyle?: ViewStyle;
}

export default function Card({
  title,
  titleColor,
  children,
  style,
  bodyStyle,
}: CardProps): React.ReactElement {
  return (
    <View style={[styles.card, style]}>
      {title ? (
        <View
          style={[
            styles.titleBar,
            titleColor ? { backgroundColor: titleColor } : styles.titleBarDefault,
          ]}
        >
          <Text style={styles.titleText} numberOfLines={1}>
            {title}
          </Text>
        </View>
      ) : null}
      <View style={[styles.body, bodyStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.sm,
  },
  titleBar: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  titleBarDefault: {
    backgroundColor: colors.forest,
  },
  titleText: {
    color: colors.cream,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    letterSpacing: 0.3,
  },
  body: {
    padding: spacing.lg,
  },
});
