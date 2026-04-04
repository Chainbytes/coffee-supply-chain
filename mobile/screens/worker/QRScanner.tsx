import { CameraView, useCameraPermissions } from 'expo-camera';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState, useRef } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button, Header, ScreenContainer } from '../../components';
import { colors, fontFamily, fontSize, radius, spacing } from '../../theme';
import { WorkerStackParamList } from '../../navigation/types';
import { AppUser } from '../../navigation/types';
import api from '../../utils/api';

interface Props {
  navigation: StackNavigationProp<WorkerStackParamList, 'QRScanner'>;
  user: AppUser;
}

interface QRPayload {
  shiftId?: string;
  checkinUrl?: string;
}

export default function QRScanner({ navigation, user }: Props): React.ReactElement {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const lastScannedRef = useRef<string | null>(null);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (!scanning || loading) return;
    if (lastScannedRef.current === data) return;
    lastScannedRef.current = data;
    setScanning(false);

    let payload: QRPayload;
    try {
      payload = JSON.parse(data) as QRPayload;
    } catch {
      Alert.alert('QR Inválido', 'Este código QR no es un turno válido.', [
        { text: 'Reintentar', onPress: () => { lastScannedRef.current = null; setScanning(true); } },
      ]);
      return;
    }

    const shiftId = payload.shiftId;
    if (!shiftId) {
      Alert.alert('QR Inválido', 'El código QR no contiene un turno válido.', [
        { text: 'Reintentar', onPress: () => { lastScannedRef.current = null; setScanning(true); } },
      ]);
      return;
    }

    setLoading(true);
    try {
      const result = await api.checkIn(shiftId, { worker_id: user.id });
      Alert.alert(
        '¡Registro Exitoso!',
        `Registrado en el turno. Bienvenido, ${result.worker.name}.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      // Already checked in is acceptable
      if (msg.toLowerCase().includes('already checked in')) {
        Alert.alert('Ya Registrado', 'Ya estás registrado en este turno.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error de Registro', msg, [
          { text: 'Reintentar', onPress: () => { lastScannedRef.current = null; setScanning(true); setLoading(false); } },
          { text: 'Cancelar', onPress: () => navigation.goBack() },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return (
      <ScreenContainer>
        <Header title="Escanear QR" showBack onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <Text style={styles.hint}>Verificando permisos de cámara...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!permission.granted) {
    return (
      <ScreenContainer>
        <Header title="Escanear QR" showBack onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <Text style={styles.permissionTitle}>Permiso de Cámara</Text>
          <Text style={styles.hint}>
            Necesitamos acceso a tu cámara para escanear el código QR del turno.
          </Text>
          <Button label="Dar Permiso" onPress={requestPermission} size="lg" />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer backgroundColor={colors.coffeeDark}>
      <Header title="Escanear QR" showBack onBack={() => navigation.goBack()} />
      <View style={styles.scannerContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scanning && !loading ? handleBarCodeScanned : undefined}
        />

        {/* Overlay */}
        <View style={styles.overlay}>
          <View style={styles.overlayTop} />
          <View style={styles.overlayMiddle}>
            <View style={styles.overlaySide} />
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <View style={styles.overlaySide} />
          </View>
          <View style={styles.overlayBottom}>
            <Text style={styles.scanInstruction}>
              {loading
                ? 'Registrando asistencia...'
                : 'Apunta la cámara al código QR del capataz'}
            </Text>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const FRAME_SIZE = 240;
const CORNER_SIZE = 28;
const CORNER_THICKNESS = 4;

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
    gap: spacing.lg,
  },
  permissionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.text,
    textAlign: 'center',
  },
  hint: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: FRAME_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scanFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    position: 'relative',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  scanInstruction: {
    color: colors.cream,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.body,
    textAlign: 'center',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: colors.lightning,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderTopLeftRadius: radius.sm,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: radius.sm,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: radius.sm,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: radius.sm,
  },
});
