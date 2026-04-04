import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Header, LoadingState, ScreenContainer } from '../../components';
import { colors, fontFamily, fontSize, radius, spacing } from '../../theme';
import { ForemanStackParamList } from '../../navigation/types';
import api, { type ShiftDetail } from '../../utils/api';

interface Props {
  navigation: StackNavigationProp<ForemanStackParamList, 'CloseShift'>;
  route: RouteProp<ForemanStackParamList, 'CloseShift'>;
}

export default function CloseShift({ navigation, route }: Props): React.ReactElement {
  const { shiftId } = route.params;
  const [shift, setShift] = useState<ShiftDetail | null>(null);
  const [loadingShift, setLoadingShift] = useState(true);
  const [closing, setClosing] = useState(false);
  const [closed, setClosed] = useState(false);
  const [summary, setSummary] = useState<{
    checkin_count: number;
    liquid_record: { asset_id: string };
    workers: Array<{ id: string; name: string }>;
  } | null>(null);

  useEffect(() => {
    void loadShift();
  }, [shiftId]);

  const loadShift = async () => {
    setLoadingShift(true);
    try {
      const data = await api.getShift(shiftId);
      setShift(data);
      if (data.status === 'closed') {
        setClosed(true);
      }
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Error al cargar turno');
      navigation.goBack();
    } finally {
      setLoadingShift(false);
    }
  };

  const handleClose = async () => {
    Alert.alert(
      'Cerrar Turno',
      `¿Confirmas el cierre del turno con ${shift?.checkins.length ?? 0} trabajadores? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Turno',
          style: 'destructive',
          onPress: async () => {
            setClosing(true);
            try {
              const result = await api.closeShift(shiftId);
              setSummary({
                checkin_count: result.checkin_count,
                liquid_record: result.liquid_record,
                workers: result.workers,
              });
              setClosed(true);
            } catch (err: unknown) {
              Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo cerrar el turno');
            } finally {
              setClosing(false);
            }
          },
        },
      ]
    );
  };

  if (loadingShift) {
    return (
      <ScreenContainer>
        <Header title="Cerrar Turno" showBack onBack={() => navigation.goBack()} />
        <LoadingState message="Cargando turno..." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Header title="Cerrar Turno" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {closed ? (
          <>
            <Card title="Turno Cerrado" titleColor={colors.success}>
              <View style={styles.iconRow}>
                <Text style={styles.doneIcon}>✅</Text>
              </View>
              <Text style={styles.doneText}>
                El turno fue cerrado y registrado en Liquid.
              </Text>
              {summary ? (
                <View style={styles.summaryRows}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Trabajadores</Text>
                    <Text style={styles.infoValue}>{summary.checkin_count}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Asset Liquid</Text>
                    <Text style={styles.infoValue} numberOfLines={1}>
                      {summary.liquid_record.asset_id.slice(0, 16)}...
                    </Text>
                  </View>
                </View>
              ) : null}
            </Card>

            {summary?.workers && summary.workers.length > 0 ? (
              <Card title="Trabajadores del Turno">
                {summary.workers.map((w) => (
                  <View key={w.id} style={styles.workerRow}>
                    <View style={styles.workerDot} />
                    <Text style={styles.workerName}>{w.name}</Text>
                  </View>
                ))}
              </Card>
            ) : null}

            <Button
              label="Volver al Inicio"
              onPress={() => navigation.navigate('ForemanHome')}
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
                <Text style={[styles.infoValue, { color: colors.success }]}>Abierto</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Trabajadores</Text>
                <Text style={styles.infoValue}>{shift?.checkins.length ?? 0}</Text>
              </View>
            </Card>

            <Card title="Confirmar Cierre" titleColor={colors.warning}>
              <Text style={styles.warningText}>
                Al cerrar el turno:
              </Text>
              <Text style={styles.bulletItem}>• Se registra la asistencia en Liquid</Text>
              <Text style={styles.bulletItem}>• Los trabajadores quedan habilitados para cobro</Text>
              <Text style={styles.bulletItem}>• No se pueden agregar más registros</Text>
            </Card>

            <Button
              label="Cerrar Turno"
              variant="danger"
              onPress={handleClose}
              loading={closing}
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
  warningText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  bulletItem: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 22,
  },
  iconRow: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  doneIcon: {
    fontSize: 48,
  },
  doneText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.body,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  summaryRows: {
    marginTop: spacing.sm,
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  workerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.forest,
  },
  workerName: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.body,
    color: colors.text,
  },
});
