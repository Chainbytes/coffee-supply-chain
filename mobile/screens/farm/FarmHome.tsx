import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Header, LoadingState, ScreenContainer } from '../../components';
import { colors, fontFamily, fontSize, radius, shadow, spacing } from '../../theme';
import { FarmStackParamList } from '../../navigation/types';
import { AppUser } from '../../navigation/types';
import api, { type Farm } from '../../utils/api';

interface Props {
  navigation: StackNavigationProp<FarmStackParamList, 'FarmHome'>;
  user: AppUser;
}

interface GridAction {
  icon: string;
  label: string;
  color: string;
  screen: keyof FarmStackParamList;
  params?: Record<string, string>;
}

const GRID: GridAction[] = [
  { icon: '📋', label: 'Turnos', color: colors.forest, screen: 'LotList' },
  { icon: '👥', label: 'Trabajadores', color: colors.coffeeBrown, screen: 'LotList' },
  { icon: '📦', label: 'Lotes', color: colors.coffeeMedium, screen: 'LotList' },
  { icon: '⚡', label: 'Nómina', color: colors.lightning, screen: 'LotList' },
];

export default function FarmHome({ navigation, user }: Props): React.ReactElement {
  const [farm, setFarm] = useState<Farm | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadFarm();
  }, []);

  const loadFarm = async () => {
    try {
      const data = await api.getFarm(user.farmId);
      setFarm(data);
    } catch {
      // silently fail — farm data is supplementary
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <Header title="Propietario" subtitle={user.name} />
      {loading ? (
        <LoadingState message="Cargando finca..." />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Farm stats */}
          <Card title={farm?.name ?? 'Mi Finca'}>
            <View style={styles.statsRow}>
              <StatBlock value={farm?.location ?? '—'} label="Región" />
              <StatBlock value={farm?.altitude_m ? `${farm.altitude_m}m` : '—'} label="Altitud" />
              <StatBlock value={String(farm?.worker_count ?? '—')} label="Trabajadores" />
            </View>
          </Card>

          {/* Grid */}
          <Text style={styles.sectionTitle}>Gestión</Text>
          <View style={styles.grid}>
            {GRID.map((item) => (
              <Pressable
                key={item.label}
                style={({ pressed }) => [styles.gridItem, { opacity: pressed ? 0.75 : 1 }]}
                onPress={() => navigation.navigate(item.screen as 'LotList')}
              >
                <View style={[styles.gridIcon, { backgroundColor: item.color }]}>
                  <Text style={styles.gridEmoji}>{item.icon}</Text>
                </View>
                <Text style={styles.gridLabel}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statBlock}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.xl,
    gap: spacing.lg,
    paddingBottom: spacing.huge,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBlock: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.forest,
  },
  statLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
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
