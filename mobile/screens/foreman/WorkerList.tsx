import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { EmptyState, Header, LoadingState, ScreenContainer } from '../../components';
import { colors, fontFamily, fontSize, radius, spacing } from '../../theme';
import { ForemanStackParamList } from '../../navigation/types';
import api, { type Checkin } from '../../utils/api';

interface Props {
  navigation: StackNavigationProp<ForemanStackParamList, 'WorkerList'>;
  route: RouteProp<ForemanStackParamList, 'WorkerList'>;
}

export default function WorkerList({ navigation, route }: Props): React.ReactElement {
  const { shiftId } = route.params;
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadWorkers();
  }, [shiftId]);

  const loadWorkers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getShift(shiftId);
      setCheckins(data.checkins);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar trabajadores');
    } finally {
      setLoading(false);
    }
  };

  const renderCheckin = ({ item, index }: { item: Checkin; index: number }) => (
    <View style={styles.workerRow}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {(item.name ?? `W${index + 1}`).charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.workerInfo}>
        <Text style={styles.workerName}>{item.name ?? 'Trabajador'}</Text>
        <Text style={styles.checkinTime}>
          {item.checked_in_at ? formatTime(item.checked_in_at) : 'Hora desconocida'}
        </Text>
      </View>
      <View style={styles.checkmark}>
        <Text style={styles.checkmarkText}>✓</Text>
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      <Header
        title="Trabajadores"
        subtitle={`Turno: ${shiftId.slice(0, 8)}...`}
        showBack
        onBack={() => navigation.goBack()}
      />
      {loading ? (
        <LoadingState message="Cargando trabajadores..." />
      ) : error ? (
        <EmptyState icon="⚠️" title="Error" message={error} />
      ) : (
        <FlatList
          data={checkins}
          keyExtractor={(item) => item.id}
          renderItem={renderCheckin}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text style={styles.countLabel}>{checkins.length} trabajadores registrados</Text>
          }
          ListEmptyComponent={
            <EmptyState
              icon="👥"
              title="Sin registros"
              message="Ningún trabajador se ha registrado en este turno aún."
            />
          }
        />
      )}
    </ScreenContainer>
  );
}

function formatTime(ts: string): string {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.xl,
    paddingBottom: spacing.huge,
  },
  countLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.md,
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.body,
    color: colors.cream,
  },
  workerInfo: {
    flex: 1,
    gap: 2,
  },
  workerName: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.body,
    color: colors.text,
  },
  checkinTime: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bold,
  },
});
