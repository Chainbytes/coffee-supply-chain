import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Header, LoadingState, ScreenContainer } from '../../components';
import { colors, fontFamily, fontSize, spacing } from '../../theme';
import { FarmStackParamList } from '../../navigation/types';
import api, { type PayrollResult, type ShiftDetail } from '../../utils/api';

interface Props {
  navigation: StackNavigationProp<FarmStackParamList, 'Payroll'>;
  route: RouteProp<FarmStackParamList, 'Payroll'>;
}

const DEFAULT_SATS = 5000;

export default function Payroll({ navigation, route }: Props): React.ReactElement {
  const { shiftId } = route.params;
  const [shift, setShift] = useState<ShiftDetail | null>(null);
  const [loadingShift, setLoadingShift] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<PayrollResult | null>(null);

  useEffect(() => {
    void loadShift();
  }, [shiftId]);

  const loadShift = async () => {
    setLoadingShift(true);
    try {
      const data = await api.getShift(shiftId);
      setShift(data);
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo cargar el turno');
      navigation.goBack();
    } finally {
      setLoadingShift(false);
    }
  };

  const handlePay = async () => {
    const workerCount = shift?.checkins.length ?? 0;
    const totalSats = workerCount * DEFAULT_SATS;

    Alert.alert(
      'Confirmar Nómina',
      `Pagar ${DEFAULT_SATS.toLocaleString()} sats a ${workerCount} trabajadores.\nTotal: ${totalSats.toLocaleString()} sats`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Pagar',
          onPress: async () => {
            setProcessing(true);
            try {
              const payResult = await api.runPayroll({
                shift_id: shiftId,
                amount_sats: DEFAULT_SATS,
              });
              setResult(payResult);
            } catch (err: unknown) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Error al procesar nómina');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  if (loadingShift) {
    return (
      <ScreenContainer>
        <Header title="Nómina" showBack onBack={() => navigation.goBack()} />
        <LoadingState message="Cargando turno..." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Header title="Nómina Lightning" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {result ? (
          <>
            <Card title="Pago Completado" titleColor={colors.success}>
              <View style={styles.iconRow}>
                <Text style={styles.doneIcon}>⚡</Text>
              </View>
              <View style={styles.summaryGrid}>
                <SummaryItem label="Pagados" value={String(result.paid_count)} />
                <SummaryItem label="Fallidos" value={String(result.failed_count)} color={result.failed_count > 0 ? colors.error : undefined} />
                <SummaryItem label="Total sats" value={result.total_sats_paid.toLocaleString()} color={colors.lightning} />
              </View>
              {result.lightning_demo_mode ? (
                <Text style={styles.demoNote}>Modo demo — pagos simulados</Text>
              ) : null}
            </Card>

            {/* Payment breakdown */}
            <Card title="Detalle de Pagos">
              {result.payments.map((p) => (
                <View key={p.worker_id} style={styles.paymentRow}>
                  <View style={styles.paymentLeft}>
                    <Text style={styles.workerName}>{p.worker_name}</Text>
                    <Text style={styles.paymentStatus}>
                      {p.status === 'paid' ? '✓ Pagado' : '✗ Fallido'}
                    </Text>
                  </View>
                  <Text style={[styles.paymentAmount, p.status === 'paid' ? styles.paid : styles.failed]}>
                    {p.status === 'paid' ? `${p.amount_sats?.toLocaleString()} sats` : p.error ?? 'Error'}
                  </Text>
                </View>
              ))}
            </Card>

            <Button
              label="Volver"
              onPress={() => navigation.navigate('FarmHome')}
              size="lg"
              fullWidth
            />
          </>
        ) : (
          <>
            <Card title={`Turno: ${shiftId.slice(0, 8)}...`}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Fecha</Text>
                <Text style={styles.infoValue}>{shift?.date}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Estado</Text>
                <Text style={[styles.infoValue, shift?.status === 'closed' ? styles.closed : styles.open]}>
                  {shift?.status === 'closed' ? 'Cerrado' : 'Abierto'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Trabajadores</Text>
                <Text style={styles.infoValue}>{shift?.checkins.length ?? 0}</Text>
              </View>
            </Card>

            <Card title="Configuración de Pago" titleColor={colors.lightning}>
              <View style={styles.payConfigRow}>
                <Text style={styles.payConfigLabel}>Pago por trabajador</Text>
                <Text style={styles.payConfigValue}>{DEFAULT_SATS.toLocaleString()} sats</Text>
              </View>
              <View style={styles.payConfigRow}>
                <Text style={styles.payConfigLabel}>Total estimado</Text>
                <Text style={[styles.payConfigValue, { color: colors.lightning }]}>
                  {((shift?.checkins.length ?? 0) * DEFAULT_SATS).toLocaleString()} sats
                </Text>
              </View>
              <Text style={styles.payHint}>Los pagos se envían vía Lightning Network instantáneamente.</Text>
            </Card>

            {shift?.status !== 'closed' ? (
              <Card titleColor={colors.warning} title="Advertencia">
                <Text style={styles.warningText}>
                  El turno debe estar cerrado antes de procesar la nómina.
                </Text>
              </Card>
            ) : null}

            <Button
              label="Pagar Trabajadores"
              variant="accent"
              onPress={handlePay}
              loading={processing}
              disabled={shift?.status !== 'closed'}
              size="lg"
              fullWidth
            />
            <Button
              label="Cancelar"
              variant="secondary"
              onPress={() => navigation.goBack()}
              size="lg"
              fullWidth
            />
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function SummaryItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={[styles.summaryValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
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
  },
  closed: { color: colors.textMuted },
  open: { color: colors.success },
  payConfigRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  payConfigLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  payConfigValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  payHint: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  warningText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  iconRow: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  doneIcon: {
    fontSize: 48,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  summaryItem: {
    alignItems: 'center',
    gap: 2,
  },
  summaryValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.forest,
  },
  summaryLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
  demoNote: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  paymentLeft: {
    gap: 2,
  },
  workerName: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.body,
    color: colors.text,
  },
  paymentStatus: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  paymentAmount: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
  },
  paid: { color: colors.lightning },
  failed: { color: colors.error },
});
