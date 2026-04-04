import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { EmptyState, Header, LoadingState, ScreenContainer } from '../../components';
import { colors, fontFamily, fontSize, radius, shadow, spacing } from '../../theme';
import { WorkerStackParamList } from '../../navigation/types';
import { AppUser } from '../../navigation/types';
import api, { type Shift } from '../../utils/api';

interface Props {
  navigation: StackNavigationProp<WorkerStackParamList, 'ShiftHistory'>;
  user: AppUser;
}

interface ShiftWithFarm extends Shift {
  farm_name?: string;
  hours?: number;
}

export default function ShiftHistory({ navigation, user }: Props): React.ReactElement {
  const [shifts, setShifts] = useState<ShiftWithFarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadShifts();
  }, []);

  const loadShifts = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch payment history to derive shift list
      const data = await api.getWorkerPayments(user.id);
      // Map payments to shift stubs — in production we'd have a /worker/:id/shifts endpoint
      const seenShifts = new Set<string>();
      const shiftList: ShiftWithFarm[] = data.payments
        .filter((p) => {
          if (seenShifts.has(p.shift_id)) return false;
          seenShifts.add(p.shift_id);
          return true;
        })
        .map((p) => ({
          id: p.shift_id,
          farm_id: user.farmId,
          foreman_id: '',
          date: p.shift_date ?? '',
          status: 'closed' as const,
          qr_data: '',
          liquid_tx: null,
          closed_at: null,
          created_at: p.created_at,
        }));
      setShifts(shiftList);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar turnos');
    } finally {
      setLoading(false);
    }
  };

  const renderShift = ({ item }: { item: ShiftWithFarm }) => (
    <View style={styles.shiftCard}>
      <View style={styles.shiftDateBlock}>
        <Text style={styles.shiftDateDay}>{formatDay(item.date)}</Text>
        <Text style={styles.shiftDateMonth}>{formatMonth(item.date)}</Text>
      </View>
      <View style={styles.shiftInfo}>
        <Text style={styles.shiftTitle}>Turno de cosecha</Text>
        <Text style={styles.shiftSub}>{item.date || 'Fecha desconocida'}</Text>
        <View style={[styles.badge, item.status === 'closed' ? styles.badgeClosed : styles.badgeOpen]}>
          <Text style={styles.badgeText}>{item.status === 'closed' ? 'Cerrado' : 'Abierto'}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      <Header title="Mis Turnos" showBack onBack={() => navigation.goBack()} />
      {loading ? (
        <LoadingState message="Cargando turnos..." />
      ) : error ? (
        <EmptyState icon="⚠️" title="Error" message={error} />
      ) : (
        <FlatList
          data={shifts}
          keyExtractor={(item) => item.id}
          renderItem={renderShift}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState icon="📋" title="Sin turnos" message="Aún no tienes turnos registrados." />
          }
        />
      )}
    </ScreenContainer>
  );
}

function formatDay(dateStr: string): string {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '--' : String(d.getDate()).padStart(2, '0');
}

function formatMonth(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '---';
  return d.toLocaleString('es', { month: 'short' }).toUpperCase();
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  shiftCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.sm,
  },
  shiftDateBlock: {
    width: 64,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  shiftDateDay: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xxl,
    color: colors.cream,
    lineHeight: 30,
  },
  shiftDateMonth: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.coffeeLight,
    letterSpacing: 1,
  },
  shiftInfo: {
    flex: 1,
    padding: spacing.md,
    gap: 4,
  },
  shiftTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.body,
    color: colors.text,
  },
  shiftSub: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginTop: 4,
  },
  badgeClosed: {
    backgroundColor: colors.creamDark,
  },
  badgeOpen: {
    backgroundColor: '#DCEDC8',
  },
  badgeText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.text,
  },
});
