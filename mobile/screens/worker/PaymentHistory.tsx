import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Card, EmptyState, Header, LoadingState, ScreenContainer } from '../../components';
import { colors, fontFamily, fontSize, radius, shadow, spacing } from '../../theme';
import { WorkerStackParamList } from '../../navigation/types';
import { AppUser } from '../../navigation/types';
import api, { type Payment, type PaymentHistoryResponse } from '../../utils/api';

interface Props {
  navigation: StackNavigationProp<WorkerStackParamList, 'PaymentHistory'>;
  user: AppUser;
}

// Rough conversion: 1 BTC = 100,000 sats; use a hardcoded rate for prototype
const BTC_USD_RATE = 85_000;
function satsToUsd(sats: number): string {
  const usd = (sats / 100_000_000) * BTC_USD_RATE;
  return usd.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
}

function formatSats(sats: number): string {
  if (sats >= 1_000_000) return `${(sats / 1_000_000).toFixed(2)}M sats`;
  if (sats >= 1_000) return `${(sats / 1_000).toFixed(1)}k sats`;
  return `${sats} sats`;
}

export default function PaymentHistory({ navigation, user }: Props): React.ReactElement {
  const [data, setData] = useState<PaymentHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadPayments();
  }, []);

  const loadPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getWorkerPayments(user.id);
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar pagos');
    } finally {
      setLoading(false);
    }
  };

  const renderPayment = ({ item }: { item: Payment }) => (
    <View style={styles.paymentCard}>
      <View style={styles.paymentLeft}>
        <Text style={styles.lightningIcon}>⚡</Text>
      </View>
      <View style={styles.paymentInfo}>
        <Text style={styles.paymentDate}>{item.shift_date ?? item.created_at?.slice(0, 10)}</Text>
        <Text style={styles.paymentStatus}>
          {item.status === 'paid' ? 'Pagado vía Lightning' : item.status === 'pending' ? 'Pendiente' : 'Fallido'}
        </Text>
      </View>
      <View style={styles.paymentRight}>
        <Text style={styles.paymentSats}>{formatSats(item.amount_sats)}</Text>
        <Text style={styles.paymentUsd}>{satsToUsd(item.amount_sats)}</Text>
      </View>
    </View>
  );

  const totalSats = data?.total_paid_sats ?? 0;

  return (
    <ScreenContainer>
      <Header title="Mis Pagos" showBack onBack={() => navigation.goBack()} />
      {loading ? (
        <LoadingState message="Cargando pagos..." />
      ) : error ? (
        <EmptyState icon="⚠️" title="Error" message={error} />
      ) : (
        <FlatList
          data={data?.payments ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderPayment}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Card title="Resumen" style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{formatSats(totalSats)}</Text>
                  <Text style={styles.summaryLabel}>Total ganado</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{satsToUsd(totalSats)}</Text>
                  <Text style={styles.summaryLabel}>Equivalente USD</Text>
                </View>
              </View>
            </Card>
          }
          ListEmptyComponent={
            <EmptyState icon="⚡" title="Sin pagos" message="Aún no has recibido pagos Lightning." />
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.xl,
    gap: spacing.md,
    paddingBottom: spacing.huge,
  },
  summaryCard: {
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  summaryValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.lightning,
  },
  summaryLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    ...shadow.sm,
  },
  paymentLeft: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightningIcon: {
    fontSize: 20,
  },
  paymentInfo: {
    flex: 1,
    gap: 2,
  },
  paymentDate: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.body,
    color: colors.text,
  },
  paymentStatus: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  paymentRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  paymentSats: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.body,
    color: colors.lightning,
  },
  paymentUsd: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});
