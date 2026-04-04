import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Header, ScreenContainer } from '../../components';
import { colors, fontFamily, fontSize, radius, shadow, spacing } from '../../theme';
import { WorkerStackParamList } from '../../navigation/types';
import { AppUser } from '../../navigation/types';

interface Props {
  navigation: StackNavigationProp<WorkerStackParamList, 'WorkerHome'>;
  user: AppUser;
}

const HOUR = new Date().getHours();
const greeting =
  HOUR < 12 ? 'Buenos días' : HOUR < 18 ? 'Buenas tardes' : 'Buenas noches';

interface GridAction {
  icon: string;
  label: string;
  screen: keyof WorkerStackParamList;
  color: string;
}

const GRID: GridAction[] = [
  { icon: '📷', label: 'Escanear QR', screen: 'QRScanner', color: colors.forest },
  { icon: '📋', label: 'Mis Turnos', screen: 'ShiftHistory', color: colors.coffeeBrown },
  { icon: '⚡', label: 'Mis Pagos', screen: 'PaymentHistory', color: colors.lightning },
  { icon: '👤', label: 'Perfil', screen: 'WorkerHome', color: colors.coffeeMedium },
];

export default function WorkerHome({ navigation, user }: Props): React.ReactElement {
  return (
    <ScreenContainer>
      <Header title="Chainbytes Coffee" subtitle="Portal del Trabajador" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Greeting */}
        <Text style={styles.greeting}>
          {greeting}, <Text style={styles.greetingName}>{user.name}</Text>
        </Text>

        {/* Shift status card */}
        <Card title="Estado del Turno" style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: colors.warning }]} />
            <Text style={styles.statusText}>Sin turno activo</Text>
          </View>
          <Text style={styles.statusHint}>Escanea el código QR del capataz para registrarte</Text>
          <Button
            label="Escanear Código QR"
            onPress={() => navigation.navigate('QRScanner')}
            fullWidth
            size="lg"
            style={{ marginTop: spacing.md }}
          />
        </Card>

        {/* 2x2 grid */}
        <Text style={styles.sectionTitle}>Acceso rápido</Text>
        <View style={styles.grid}>
          {GRID.map((item) => (
            <Pressable
              key={item.screen + item.label}
              style={({ pressed }) => [
                styles.gridItem,
                { opacity: pressed ? 0.75 : 1 },
              ]}
              onPress={() => navigation.navigate(item.screen as 'QRScanner')}
            >
              <View style={[styles.gridIcon, { backgroundColor: item.color }]}>
                <Text style={styles.gridEmoji}>{item.icon}</Text>
              </View>
              <Text style={styles.gridLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
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
  greeting: {
    color: colors.text,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.lg,
    marginBottom: spacing.xs,
  },
  greetingName: {
    fontFamily: fontFamily.bold,
    color: colors.forest,
  },
  statusCard: {
    marginTop: spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.body,
    color: colors.text,
  },
  statusHint: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 20,
  },
  sectionTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: spacing.sm,
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
