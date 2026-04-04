import React, { useCallback } from 'react';
import { Clipboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';

export interface AddressDisplayProps {
  address: string;
  label?: string;
  compact?: boolean;
}

function formatAddress(address: string): string {
  if (!address || address.length < 12) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

export default function AddressDisplay({
  address,
  label,
  compact = false,
}: AddressDisplayProps): React.ReactElement {
  const formatted = formatAddress(address);

  const handleCopy = useCallback(() => {
    Clipboard.setString(address);
  }, [address]);

  if (compact) {
    return (
      <Pressable
        onPress={handleCopy}
        style={({ pressed }) => [styles.compactRow, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Text style={styles.compactAddress}>{formatted}</Text>
        <Text style={styles.copyHint}>⎘</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        onPress={handleCopy}
        style={({ pressed }) => [styles.addressRow, { opacity: pressed ? 0.7 : 1 }]}
      >
        <Text style={styles.address}>{formatted}</Text>
        <Text style={styles.copyHint}>⎘</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    color: colors.textMuted,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    letterSpacing: 0.4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    alignSelf: 'flex-start',
  },
  address: {
    color: colors.text,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    letterSpacing: 0.5,
  },
  copyHint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  compactAddress: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    letterSpacing: 0.4,
  },
});
