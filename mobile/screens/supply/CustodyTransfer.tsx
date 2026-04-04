import { CameraView, useCameraPermissions } from 'expo-camera';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState, useRef } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Header, ScreenContainer } from '../../components';
import { colors, fontFamily, fontSize, radius, spacing } from '../../theme';
import { SupplyStackParamList } from '../../navigation/types';
import { AppUser } from '../../navigation/types';
import api, { type LotDetail } from '../../utils/api';

interface Props {
  navigation: StackNavigationProp<SupplyStackParamList, 'CustodyTransfer'>;
  user: AppUser;
}

type EntityType = 'wet_mill' | 'dry_mill' | 'exporter' | 'roaster';

const ENTITY_OPTIONS: Array<{ type: EntityType; label: string; icon: string }> = [
  { type: 'wet_mill', label: 'Beneficio Húmedo', icon: '💧' },
  { type: 'dry_mill', label: 'Beneficio Seco', icon: '☀️' },
  { type: 'exporter', label: 'Exportador', icon: '🚢' },
  { type: 'roaster', label: 'Tostador', icon: '🔥' },
];

export default function CustodyTransfer({ navigation, user }: Props): React.ReactElement {
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<'scan' | 'confirm' | 'done'>('scan');
  const [lotData, setLotData] = useState<LotDetail | null>(null);
  const [selectedType, setSelectedType] = useState<EntityType>('wet_mill');
  const [toEntity, setToEntity] = useState('');
  const [loading, setLoading] = useState(false);
  const lastScannedRef = useRef<string | null>(null);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (loading) return;
    if (lastScannedRef.current === data) return;
    lastScannedRef.current = data;

    // QR could be a lot ID or a provenance URL
    let lotId = data;
    if (data.includes('/provenance/')) {
      const parts = data.split('/provenance/');
      lotId = parts[parts.length - 1] ?? data;
    }

    setLoading(true);
    try {
      const result = await api.getLot(lotId);
      setLotData(result);
      setStep('confirm');
    } catch (err: unknown) {
      Alert.alert('QR Inválido', err instanceof Error ? err.message : 'No se encontró el lote.', [
        {
          text: 'Reintentar',
          onPress: () => {
            lastScannedRef.current = null;
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!lotData || !toEntity.trim()) {
      Alert.alert('Error', 'Ingresa el nombre del destinatario.');
      return;
    }

    setLoading(true);
    try {
      await api.transferLot(lotData.lot.id, {
        to_entity: toEntity.trim(),
        entity_type: selectedType,
      });
      setStep('done');
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo transferir el lote.');
    } finally {
      setLoading(false);
    }
  };

  if (!permission?.granted && step === 'scan') {
    return (
      <ScreenContainer>
        <Header title="Transferir Custodia" showBack onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <Text style={styles.permTitle}>Permiso de Cámara</Text>
          <Text style={styles.hint}>Se necesita la cámara para escanear el QR del lote.</Text>
          <Button label="Dar Permiso" onPress={requestPermission ?? (() => {})} size="lg" />
        </View>
      </ScreenContainer>
    );
  }

  if (step === 'done') {
    return (
      <ScreenContainer>
        <Header title="Transferencia Exitosa" />
        <ScrollView contentContainerStyle={styles.scroll}>
          <Card title="Custodia Transferida" titleColor={colors.success}>
            <View style={styles.iconRow}>
              <Text style={styles.doneIcon}>✅</Text>
            </View>
            <Text style={styles.doneText}>
              El lote fue transferido exitosamente a {toEntity} en Liquid.
            </Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Lote</Text>
              <Text style={styles.infoValue}>{lotData?.lot.id.slice(0, 16)}...</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Destino</Text>
              <Text style={styles.infoValue}>{toEntity}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tipo</Text>
              <Text style={styles.infoValue}>
                {ENTITY_OPTIONS.find((e) => e.type === selectedType)?.label}
              </Text>
            </View>
          </Card>
          <Button
            label="Ver Proveniencia"
            onPress={() =>
              navigation.navigate('LotProvenance', { lotId: lotData?.lot.id ?? '' })
            }
            size="lg"
            fullWidth
          />
          <Button
            label="Nueva Transferencia"
            variant="secondary"
            onPress={() => {
              setStep('scan');
              setLotData(null);
              lastScannedRef.current = null;
              setToEntity('');
            }}
            size="lg"
            fullWidth
          />
        </ScrollView>
      </ScreenContainer>
    );
  }

  if (step === 'confirm' && lotData) {
    return (
      <ScreenContainer>
        <Header title="Confirmar Transferencia" showBack onBack={() => setStep('scan')} />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Card title="Lote Escaneado">
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ID del Lote</Text>
              <Text style={styles.infoValue}>{lotData.lot.id.slice(0, 16)}...</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Peso</Text>
              <Text style={styles.infoValue}>{lotData.lot.weight_kg} kg</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Grado</Text>
              <Text style={styles.infoValue}>{lotData.lot.grade}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Asset Liquid</Text>
              <Text style={styles.infoValue}>{lotData.lot.asset_id.slice(0, 16)}...</Text>
            </View>
          </Card>

          <Card title="Tipo de Destino">
            {ENTITY_OPTIONS.map((opt) => (
              <Button
                key={opt.type}
                label={`${opt.icon}  ${opt.label}`}
                variant={selectedType === opt.type ? 'primary' : 'secondary'}
                onPress={() => setSelectedType(opt.type)}
                size="md"
                fullWidth
                style={{ marginBottom: spacing.sm }}
              />
            ))}
          </Card>

          <Card title="Nombre del Destinatario">
            <Text style={styles.inputLabel}>Empresa o persona que recibe el lote</Text>
            <View style={styles.textInputWrapper}>
              <Text
                style={[styles.textInput, !toEntity && styles.placeholder]}
                onPress={() => {}}
              >
                {toEntity || 'Ej: Beneficio El Molino'}
              </Text>
            </View>
            <Text style={styles.inputHint}>
              En producción este campo sería un TextInput. Para el prototipo, usa el nombre de la entidad.
            </Text>
            {/* Quick-fill buttons for prototype */}
            <View style={styles.quickFill}>
              {['Beneficio El Molino', 'Exportadora San Miguel', 'Tostadora Artesanal'].map((name) => (
                <Button
                  key={name}
                  label={name}
                  variant="ghost"
                  size="sm"
                  onPress={() => setToEntity(name)}
                  style={styles.quickFillBtn}
                />
              ))}
            </View>
          </Card>

          <Button
            label="Confirmar Transferencia"
            onPress={handleTransfer}
            loading={loading}
            disabled={!toEntity.trim()}
            size="lg"
            fullWidth
          />
          <Button
            label="Cancelar"
            variant="secondary"
            onPress={() => { setStep('scan'); lastScannedRef.current = null; }}
            size="lg"
            fullWidth
          />
        </ScrollView>
      </ScreenContainer>
    );
  }

  // step === 'scan'
  return (
    <ScreenContainer backgroundColor={colors.coffeeDark}>
      <Header title="Escanear Lote" showBack onBack={() => navigation.goBack()} />
      <View style={styles.scannerContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={!loading ? handleBarCodeScanned : undefined}
        />
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
            <Text style={styles.scanHint}>
              {loading ? 'Cargando lote...' : 'Escanea el código QR del lote de cosecha'}
            </Text>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const FRAME = 240;
const C = 28;
const T = 4;

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
    gap: spacing.lg,
  },
  permTitle: {
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
  },
  scroll: {
    padding: spacing.xl,
    gap: spacing.lg,
    paddingBottom: spacing.huge,
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: FRAME,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scanFrame: {
    width: FRAME,
    height: FRAME,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  scanHint: {
    color: colors.cream,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.body,
    textAlign: 'center',
  },
  corner: {
    position: 'absolute',
    width: C,
    height: C,
    borderColor: colors.lightning,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: T,
    borderLeftWidth: T,
    borderTopLeftRadius: radius.sm,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: T,
    borderRightWidth: T,
    borderTopRightRadius: radius.sm,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: T,
    borderLeftWidth: T,
    borderBottomLeftRadius: radius.sm,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: T,
    borderRightWidth: T,
    borderBottomRightRadius: radius.sm,
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
  inputLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  textInputWrapper: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
    marginBottom: spacing.xs,
  },
  textInput: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body,
    color: colors.text,
  },
  placeholder: {
    color: colors.textMuted,
  },
  inputHint: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    lineHeight: 16,
    marginBottom: spacing.sm,
  },
  quickFill: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  quickFillBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
  },
});
