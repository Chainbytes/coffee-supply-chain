import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, EmptyState, Header, LoadingState, ScreenContainer } from '../../components';
import { colors, fontFamily, fontSize, radius, spacing } from '../../theme';
import { FarmStackParamList } from '../../navigation/types';
import api, { type ProvenanceData } from '../../utils/api';

interface Props {
  navigation: StackNavigationProp<FarmStackParamList, 'LotDetail'>;
  route: RouteProp<FarmStackParamList, 'LotDetail'>;
}

const ENTITY_ICONS: Record<string, string> = {
  farm: '🌱',
  wet_mill: '💧',
  dry_mill: '☀️',
  exporter: '🚢',
  roaster: '🔥',
};

export default function LotDetail({ navigation, route }: Props): React.ReactElement {
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
      setError(err instanceof Error ? err.message : 'Error al cargar lote');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <Header title="Detalle de Lote" showBack onBack={() => navigation.goBack()} />
        <LoadingState message="Cargando proveniencia..." />
      </ScreenContainer>
    );
  }

  if (error || !data) {
    return (
      <ScreenContainer>
        <Header title="Detalle de Lote" showBack onBack={() => navigation.goBack()} />
        <EmptyState icon="⚠️" title="Error" message={error ?? 'Lote no encontrado'} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Header title="Lote de Cosecha" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Lot info */}
        <Card title="Información del Lote">
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ID del lote</Text>
            <Text style={styles.infoValue}>{data.lot.id.slice(0, 16)}...</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Peso</Text>
            <Text style={styles.infoValue}>{data.lot.weight_kg} kg</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Grado</Text>
            <Text style={[styles.infoValue, styles.gradeValue]}>Grado {data.lot.grade}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Finca</Text>
            <Text style={styles.infoValue}>{data.farm?.name ?? '—'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Asset Liquid</Text>
            <Text style={styles.infoValue}>{data.lot.asset_id.slice(0, 16)}...</Text>
          </View>
        </Card>

        {/* Workers who picked this lot */}
        {data.workers.length > 0 ? (
          <Card title={`Trabajadores (${data.workers.length})`}>
            {data.workers.map((w, i) => (
              <View key={i} style={styles.workerRow}>
                <View style={styles.workerAvatar}>
                  <Text style={styles.workerAvatarText}>{w.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.workerInfo}>
                  <Text style={styles.workerName}>{w.name}</Text>
                  {w.checked_in_at ? (
                    <Text style={styles.workerTime}>{w.checked_in_at.slice(0, 16).replace('T', ' ')}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </Card>
        ) : null}

        {/* Custody chain timeline */}
        <Card title="Cadena de Custodia">
          {data.transfers.length === 0 ? (
            <Text style={styles.noTransfers}>Sin transferencias registradas.</Text>
          ) : (
            data.transfers.map((transfer, idx) => (
              <View key={transfer.id} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.timelineDot, { backgroundColor: colors.forest }]}>
                    <Text style={styles.timelineDotIcon}>
                      {ENTITY_ICONS[transfer.entity_type] ?? '📦'}
                    </Text>
                  </View>
                  {idx < data.transfers.length - 1 ? <View style={styles.timelineLine} /> : null}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineEntity}>{transfer.to_entity}</Text>
                  <Text style={styles.timelineType}>
                    {formatEntityType(transfer.entity_type)}
                  </Text>
                  <Text style={styles.timelineDate}>{transfer.timestamp.slice(0, 16)}</Text>
                </View>
              </View>
            ))
          )}
        </Card>

        {/* Payment summary */}
        {data.payment_summary ? (
          <Card title="Nómina del Turno" titleColor={colors.lightning}>
            <View style={styles.payRow}>
              <View style={styles.payBlock}>
                <Text style={styles.payValue}>{data.payment_summary.worker_count}</Text>
                <Text style={styles.payLabel}>Trabajadores pagados</Text>
              </View>
              <View style={styles.payBlock}>
                <Text style={[styles.payValue, { color: colors.lightning }]}>
                  {data.payment_summary.total_sats?.toLocaleString() ?? '0'} sats
                </Text>
                <Text style={styles.payLabel}>Total pagado</Text>
              </View>
            </View>
          </Card>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

function formatEntityType(type: string): string {
  const labels: Record<string, string> = {
    farm: 'Finca (Cosecha)',
    wet_mill: 'Beneficio Húmedo',
    dry_mill: 'Beneficio Seco',
    exporter: 'Exportador',
    roaster: 'Tostador',
  };
  return labels[type] ?? type;
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.xl,
    gap: spacing.lg,
    paddingBottom: spacing.huge,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  infoLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  infoValue: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: colors.text,
    flexShrink: 1,
    marginLeft: spacing.md,
  },
  gradeValue: {
    color: colors.forest,
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  workerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workerAvatarText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.cream,
  },
  workerInfo: {
    flex: 1,
    gap: 2,
  },
  workerName: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.body,
    color: colors.text,
  },
  workerTime: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  noTransfers: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  timelineItem: {
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 60,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 40,
  },
  timelineDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotIcon: {
    fontSize: 16,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.divider,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: spacing.lg,
    gap: 2,
  },
  timelineEntity: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.body,
    color: colors.text,
  },
  timelineType: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.forest,
  },
  timelineDate: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
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
});
