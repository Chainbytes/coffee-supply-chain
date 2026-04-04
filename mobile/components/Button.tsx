import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { colors, fontFamily, fontSize, layout, radius, shadow, spacing } from '../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost';
export type ButtonSize = 'lg' | 'md' | 'sm';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

type VariantStyle = {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  textColor: string;
};

const variantStyles: Record<ButtonVariant, VariantStyle> = {
  primary: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
    borderWidth: 0,
    textColor: colors.cream,
  },
  secondary: {
    backgroundColor: colors.cream,
    borderColor: colors.forest,
    borderWidth: 1.5,
    textColor: colors.forest,
  },
  accent: {
    backgroundColor: colors.lightning,
    borderColor: colors.lightning,
    borderWidth: 0,
    textColor: colors.white,
  },
  danger: {
    backgroundColor: colors.error,
    borderColor: colors.error,
    borderWidth: 0,
    textColor: colors.white,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: 0,
    textColor: colors.forest,
  },
};

const sizeStyles: Record<ButtonSize, { height: number; paddingHorizontal: number }> = {
  lg: { height: layout.buttonHeight.lg, paddingHorizontal: spacing.xxl },
  md: { height: layout.buttonHeight.md, paddingHorizontal: spacing.xl },
  sm: { height: layout.buttonHeight.sm, paddingHorizontal: spacing.lg },
};

const labelSizes: Record<ButtonSize, number> = {
  lg: fontSize.body,
  md: fontSize.sm,
  sm: fontSize.xs,
};

export default function Button({
  variant = 'primary',
  size = 'md',
  label,
  onPress,
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
}: ButtonProps): React.ReactElement {
  const vs = variantStyles[variant];
  const ss = sizeStyles[size];
  const isDisabled = disabled || loading;
  const appliedShadow = variant !== 'ghost' ? shadow.sm : {};

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: vs.backgroundColor,
          borderColor: vs.borderColor,
          borderWidth: vs.borderWidth,
          height: ss.height,
          paddingHorizontal: ss.paddingHorizontal,
          borderRadius: radius.md,
          opacity: isDisabled ? 0.48 : pressed ? 0.82 : 1,
          alignSelf: fullWidth ? undefined : 'auto',
          ...appliedShadow,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={vs.textColor} />
      ) : (
        <View style={styles.inner}>
          <Text
            style={[
              styles.label,
              {
                color: vs.textColor,
                fontSize: labelSizes[size],
                fontFamily: fontFamily.semibold,
              },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  label: {
    letterSpacing: 0.2,
  },
});
