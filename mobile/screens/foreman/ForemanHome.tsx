import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Header, ScreenContainer } from '../../components';
import { colors, fontFamily, fontSize, radius, shadow, spacing } from '../../theme';
import { ForemanStackParamList } from '../../navigation/types';
import { AppUser } from '../../navigation/types';
import api, { type ShiftDetail } from '../../utils/api';

interface Props {
  navigation: StackNavigationProp<ForemanStackParamList, 'ForemanHome'>;
  user: AppUser;
}

interface GridAction {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}

export default function ForemanHome({ navigation, user }: Props): React.ReactElement {
  const [activeShift, setActiveShift] = useState<ShiftDetail | null>(null);
  const [checkinCount, setCheckinCount] = useState(0);

  // In prototype, we track the active shift in component state.
  // In production, this would be persisted to local storage / backend.
  const grid: GridAction[] = [
    {
      icon: '➕',
      label: 'Crear Turno',
      color: colors.forest,
      onPress: () => navigation.navigate('CreateShift'),
    },
    {
      icon: '👥',
      label: 'Mis Trabajadores',
      color: colors.coffeeBrown,
      onPress: () => {
        if (activeShift) {
          navigation.navigate('WorkerList', { shiftId: activeShift.id });
        }
      },
    },
    {
      icon: '🔒',
      label: 'Cerrar Turno',
      color: colors.error,
      onPress: () => {
        if (activeShift) {
          navigation.navigate('CloseShift', { shiftId: activeShift.id });
        }
      },
    },
    {
      icon: '👤',
      label: 'Perfil',
      color: colors.coffeeMedium,
      onPress: () => {},
    },
  ];

  return (
    <ScreenContainer>
      <Header title="Capataz" subtitle={user.name} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Active shift status */}
        <Card title="Turno Activo" style={styles.shiftCard}>
          {activeShift ? (
            <View style={styles.activeShift}>
              <View style={styles.statusRow}>
                <View style={[styles.dot, { backgroundColor: colors.success }]} />
                <Text style={styles.statusText}>Turno abierto</Text>
              </View>
              <Text style={styles.shiftDate}>{activeShift.date}</Text>
              <Text style={styles.workerCount}>{checkinCount} trabajadores registrados</Text>
              <Text style={styles.shiftId}>ID: {activeShift.id.slice(0, 8)}...</Text>
            </View>
          ) : (
            <View>
              <View style={styles.statusRow}>
                <View style={[styles.dot, { backgroundColor: colors.textMuted }]} />
                <Text style={styles.statusText}>Sin turno activo</Text>
              </View>
              <Text style={styles.hint}>Crea un turno para generar un código QR para los trabajadores.</Text>
            </View>
          )}
        </Card>

        {/* Grid */}
        <Text style={styles.sectionTitle}>Acciones</Text>
        <View style={styles.grid}>
          {grid.map((item) => (
            <Pressable
              key={item.label}
              style={({ pressed }) => [styles.gridItem, { opacity: pressed ? 0.75 : 1 }]}
              onPress={item.onPress}
            >
              <View style={[styles.gridIcon, { backgroundColor: item.color }]}>
                <Text style={styles.gridEmoji}>{item.icon}</Text>
              </View>
              <Text style={styles.gridLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.xl,
    gap: spacing.lg,
    paddingBottom: spacing.huge,
  },
  shiftCard: {},
  activeShift: {
    gap: spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.body,
    color: colors.text,
  },
  shiftDate: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  workerCount: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  shiftId: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  hint: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 20,
  },
  sectionTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  gridItem: {
    width: '47%',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadow.sm,
  },
  gridIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridEmoji: {
    fontSize: 24,
  },
  gridLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text,
    textAlign: 'center',
  },
});
