import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Header, ScreenContainer } from '../../components';
import { colors, fontFamily, fontSize, radius, spacing } from '../../theme';
import { ForemanStackParamList } from '../../navigation/types';
import { AppUser } from '../../navigation/types';
import api, { type CreateShiftResponse } from '../../utils/api';

interface Props {
  navigation: StackNavigationProp<ForemanStackParamList, 'CreateShift'>;
  user: AppUser;
}

export default function CreateShift({ navigation, user }: Props): React.ReactElement {
  const [loading, setLoading] = useState(false);
  const [shift, setShift] = useState<CreateShiftResponse | null>(null);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const result = await api.createShift({
        farm_id: user.farmId,
        foreman_id: user.id,
        date: today,
      });
      setShift(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleViewWorkers = () => {
    if (shift) {
      navigation.navigate('WorkerList', { shiftId: shift.id });
    }
  };

  return (
    <ScreenContainer>
      <Header title="Crear Turno" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {!shift ? (
          <Card title="Nuevo Turno de Cosecha">
            <Text style={styles.description}>
              Al crear un turno se generará un código QR único que los trabajadores podrán escanear
              para registrar su asistencia.
            </Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Fecha</Text>
              <Text style={styles.infoValue}>{new Date().toLocaleDateString('es')}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Capataz</Text>
              <Text style={styles.infoValue}>{user.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Finca</Text>
              <Text style={styles.infoValue}>{user.farmId.slice(0, 8)}...</Text>
            </View>

            <Button
              label="Crear Turno y Generar QR"
              onPress={handleCreate}
              loading={loading}
              size="lg"
              fullWidth
              style={{ marginTop: spacing.lg }}
            />
          </Card>
        ) : (
          <>
            <Card title="Turno Creado" titleColor={colors.success}>
              <Text style={styles.successText}>El turno fue creado exitosamente.</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>ID del turno</Text>
                <Text style={styles.infoValue}>{shift.id.slice(0, 16)}...</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Fecha</Text>
                <Text style={styles.infoValue}>{shift.date}</Text>
              </View>
              {shift.qr_payload?.expiresAt ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Expira</Text>
                  <Text style={styles.infoValue}>
                    {new Date(shift.qr_payload.expiresAt).toLocaleTimeString('es')}
                  </Text>
                </View>
              ) : null}
            </Card>

            {/* QR Code */}
            <Card title="Código QR para Trabajadores">
              <View style={styles.qrContainer}>
                {shift.qr_image ? (
                  <Image
                    source={{ uri: shift.qr_image }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.qrPlaceholder}>
                    <Text style={styles.qrPlaceholderText}>QR no disponible</Text>
                  </View>
                )}
              </View>
              <Text style={styles.qrHint}>
                Muestra este código a los trabajadores para que puedan registrarse al turno.
              </Text>
            </Card>

            <View style={styles.actions}>
              <Button
                label="Ver Trabajadores Registrados"
                onPress={handleViewWorkers}
                size="lg"
                fullWidth
              />
              <Button
                label="Crear Otro Turno"
                onPress={() => setShift(null)}
                variant="secondary"
                size="lg"
                fullWidth
              />
            </View>
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
  description: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: spacing.lg,
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
  successText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.body,
    color: colors.success,
    marginBottom: spacing.md,
  },
  qrContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  qrImage: {
    width: 240,
    height: 240,
    borderRadius: radius.md,
  },
  qrPlaceholder: {
    width: 240,
    height: 240,
    borderRadius: radius.md,
    backgroundColor: colors.creamDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPlaceholderText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  qrHint: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  actions: {
    gap: spacing.md,
  },
});
