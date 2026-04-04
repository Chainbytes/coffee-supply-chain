import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { EmptyState, Header, ListItem, LoadingState, ScreenContainer } from '../../components';
import { colors, fontFamily, fontSize, radius, spacing } from '../../theme';
import { FarmStackParamList } from '../../navigation/types';
import { AppUser } from '../../navigation/types';

interface Props {
  navigation: StackNavigationProp<FarmStackParamList, 'LotList'>;
  user: AppUser;
}

// In prototype: hardcoded demo lots until a GET /farm/:id/lots endpoint is added to backend
const DEMO_LOTS = [
  {
    id: 'lot-001',
    shift_id: 'shift-001',
    farm_id: 'farm-001',
    weight_kg: 125.5,
    grade: 'A' as const,
    asset_id: 'liq1q_demo_001',
    created_at: '2026-04-01 08:00:00',
  },
  {
    id: 'lot-002',
    shift_id: 'shift-002',
    farm_id: 'farm-001',
    weight_kg: 89.0,
    grade: 'B' as const,
    asset_id: 'liq1q_demo_002',
    created_at: '2026-04-02 07:30:00',
  },
];

const GRADE_COLORS: Record<string, string> = {
  A: colors.success,
  B: colors.warning,
  C: colors.error,
};

export default function LotList({ navigation }: Props): React.ReactElement {
  const [lots] = useState(DEMO_LOTS);
  const [loading] = useState(false);

  const renderLot = ({ item }: { item: typeof DEMO_LOTS[0] }) => (
    <ListItem
      title={`Lote ${item.id.slice(-3).toUpperCase()} — ${item.weight_kg} kg`}
      subtitle={`Creado: ${item.created_at.slice(0, 10)}`}
      leftElement={
        <View style={[styles.gradeBadge, { backgroundColor: GRADE_COLORS[item.grade] }]}>
          <Text style={styles.gradeText}>{item.grade}</Text>
        </View>
      }
      rightElement={<Text style={styles.arrow}>›</Text>}
      onPress={() => navigation.navigate('LotDetail', { lotId: item.id })}
    />
  );

  return (
    <ScreenContainer>
      <Header title="Lotes de Cosecha" showBack onBack={() => navigation.goBack()} />
      {loading ? (
        <LoadingState message="Cargando lotes..." />
      ) : (
        <FlatList
          data={lots}
          keyExtractor={(item) => item.id}
          renderItem={renderLot}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text style={styles.countLabel}>{lots.length} lotes registrados</Text>
          }
          ListEmptyComponent={
            <EmptyState icon="📦" title="Sin lotes" message="No hay lotes de cosecha registrados." />
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.xl,
    paddingHorizontal: 0,
    paddingBottom: spacing.huge,
  },
  countLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  gradeBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.white,
  },
  arrow: {
    fontSize: 20,
    color: colors.textMuted,
  },
});
