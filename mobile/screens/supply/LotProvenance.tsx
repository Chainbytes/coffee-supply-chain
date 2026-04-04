import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, EmptyState, Header, LoadingState, ScreenContainer } from '../../components';
import { colors, fontFamily, fontSize, radius, spacing } from '../../theme';
import { SupplyStackParamList } from '../../navigation/types';
import api, { type ProvenanceData } from '../../utils/api';

interface Props {
  navigation: StackNavigationProp<SupplyStackParamList, 'LotProvenance'>;
  route: RouteProp<SupplyStackParamList, 'LotProvenance'>;
}

const ENTITY_ICONS: Record<string, string> = {
  farm: '🌱',
  wet_mill: '💧',
  dry_mill: '☀️',
  exporter: '🚢',
  roaster: '🔥',
};

const ENTITY_LABELS: Record<string, string> = {
  farm: 'Finca',
  wet_mill: 'Beneficio Húmedo',
  dry_mill: 'Beneficio Seco',
  exporter: 'Exportador',
  roaster: 'Tostador',
};

export default function LotProvenance({ navigation, route }: Props): React.ReactElement {
  const { lotId } = route.params;
  const [data, setData] = useState<ProvenanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadProvenance();
  }, [lotId]);

  const loadProvenance = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getProvenance(lotId);
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar proveniencia');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <Header title="Proveniencia" showBack onBack={() => navigation.goBack()} />
        <LoadingState message="Cargando cadena de custodia..." />
      </ScreenContainer>
    );
  }

  if (error || !data) {
    return (
      <ScreenContainer>
        <Header title="Proveniencia" showBack onBack={() => navigation.goBack()} />
        <EmptyState icon="⚠️" title="Error" message={error ?? 'No se encontró el lote'} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Header title="Proveniencia del Lote" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>☕</Text>
          <Text style={styles.heroTitle}>{data.farm?.name ?? 'Café de Origen'}</Text>
          <Text style={styles.heroSub}>
            {data.farm?.location ? `${data.farm.location}` : ''}
            {data.farm?.altitude_m ? ` · ${data.farm.altitude_m}m` : ''}
          </Text>
        </View>

        {/* Lot info */}
        <Card title="Datos del Lote">
          <View style={styles.lotRow}>
            <LotStat label="Peso" value={`${data.lot.weight_kg} kg`} />
            <LotStat label="Grado" value={`Grado ${data.lot.grade}`} />
            <LotStat label="Turno" value={data.shift?.date ?? '—'} />
          </View>
          {data.lot.notes ? (
            <Text style={styles.notes}>{data.lot.notes}</Text>
          ) : null}
        </Card>

        {/* Workers */}
        {data.workers.length > 0 ? (
          <Card title={`Cosechado por ${data.workers.length} trabajadores`}>
            <View style={styles.workerChips}>
              {data.workers.map((w, i) => (
                <View key={i} style={styles.workerChip}>
                  <Text style={styles.workerChipText}>{w.name}</Text>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        {/* Full custody timeline */}
        <Card title="Cadena de Custodia">
          {data.transfers.length === 0 ? (
            <Text style={styles.noData}>Sin transferencias registradas.</Text>
          ) : (
            data.transfers.map((transfer, idx) => (
              <View key={transfer.id} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.dot, idx === 0 ? styles.dotFirst : styles.dotNormal]}>
                    <Text style={styles.dotIcon}>{ENTITY_ICONS[transfer.entity_type] ?? '📦'}</Text>
                  </View>
                  {idx < data.transfers.length - 1 ? <View style={styles.line} /> : null}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.entityName}>{transfer.to_entity}</Text>
                  <Text style={styles.entityType}>
                    {ENTITY_LABELS[transfer.entity_type] ?? transfer.entity_type}
                  </Text>
                  <Text style={styles.entityDate}>{transfer.timestamp.slice(0, 16)}</Text>
                  {transfer.metadata ? (
                    <MetadataBlock metadata={transfer.metadata} />
                  ) : null}
                </View>
              </View>
            ))
          )}
        </Card>

        {/* Payment */}
        {data.payment_summary?.worker_count > 0 ? (
          <Card title="Pagos a Trabajadores" titleColor={colors.lightning}>
            <View style={styles.payRow}>
              <View style={styles.payBlock}>
                <Text style={styles.payValue}>{data.payment_summary.worker_count}</Text>
                <Text style={styles.payLabel}>Trabajadores pagados</Text>
              </View>
              <View style={styles.payBlock}>
                <Text style={[styles.payValue, { color: colors.lightning }]}>
                  {(data.payment_summary.total_sats ?? 0).toLocaleString()} sats
                </Text>
                <Text style={styles.payLabel}>Lightning Network</Text>
              </View>
            </View>
          </Card>
        ) : null}

        {/* Liquid asset */}
        <Card title="Activo en Liquid">
          <Text style={styles.assetId} selectable>
            {data.lot.asset_id}
          </Text>
          <Text style={styles.assetHint}>
            Este lote está registrado como un activo emitido en la red Liquid (sidechain de Bitcoin).
            Cada transferencia de custodia es inmutable en la cadena.
          </Text>
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}

function LotStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.lotStat}>
      <Text style={styles.lotStatValue}>{value}</Text>
      <Text style={styles.lotStatLabel}>{label}</Text>
    </View>
  );
}

function MetadataBlock({ metadata }: { metadata: Record<string, unknown> }) {
  const keys = Object.keys(metadata).filter((k) => k !== 'action' && metadata[k] != null);
  if (keys.length === 0) return null;
  return (
    <View style={styles.metaBlock}>
      {keys.slice(0, 4).map((k) => (
        <Text key={k} style={styles.metaItem}>
          {k.replace(/_/g, ' ')}: {String(metadata[k])}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.xl,
    gap: spacing.lg,
    paddingBottom: spacing.huge,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  heroTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xxl,
    color: colors.text,
    textAlign: 'center',
  },
  heroSub: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  lotRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  lotStat: {
    alignItems: 'center',
    gap: 2,
  },
  lotStatValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.forest,
  },
  lotStatLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  notes: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  workerChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  workerChip: {
    backgroundColor: colors.creamDark,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  workerChipText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.forest,
  },
  noData: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  timelineItem: {
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 56,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 44,
  },
  dot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotFirst: {
    backgroundColor: colors.forest,
  },
  dotNormal: {
    backgroundColor: colors.coffeeMedium,
  },
  dotIcon: {
    fontSize: 18,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: colors.divider,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: spacing.xl,
    gap: 3,
  },
  entityName: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.body,
    color: colors.text,
  },
  entityType: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.forest,
  },
  entityDate: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  metaBlock: {
    marginTop: spacing.xs,
    padding: spacing.sm,
    backgroundColor: colors.creamDark,
    borderRadius: radius.sm,
    gap: 2,
  },
  metaItem: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.text,
    textTransform: 'capitalize',
  },
  payRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  payBlock: {
    alignItems: 'center',
    gap: 2,
  },
  payValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.forest,
  },
  payLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
  assetId: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.text,
    letterSpacing: 0.5,
    backgroundColor: colors.creamDark,
    padding: spacing.md,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  assetHint: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
