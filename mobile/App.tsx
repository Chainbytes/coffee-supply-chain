import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Font from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  type AppUser,
  type Role,
  type WorkerStackParamList,
  type ForemanStackParamList,
  type FarmStackParamList,
  type SupplyStackParamList,
} from './navigation/types';
import { colors, fontFamily, fontSize, radius, shadow, spacing } from './theme';

// Worker screens
import WorkerHome from './screens/worker/WorkerHome';
import QRScanner from './screens/worker/QRScanner';
import ShiftHistory from './screens/worker/ShiftHistory';
import PaymentHistory from './screens/worker/PaymentHistory';

// Foreman screens
import ForemanHome from './screens/foreman/ForemanHome';
import CreateShift from './screens/foreman/CreateShift';
import WorkerList from './screens/foreman/WorkerList';
import CloseShift from './screens/foreman/CloseShift';

// Farm owner screens
import FarmHome from './screens/farm/FarmHome';
import LotList from './screens/farm/LotList';
import LotDetail from './screens/farm/LotDetail';
import Payroll from './screens/farm/Payroll';

// Supply chain screens
import CustodyTransfer from './screens/supply/CustodyTransfer';
import LotProvenance from './screens/supply/LotProvenance';

// ------------------------------------------------------------------ stacks

const WorkerStack = createStackNavigator<WorkerStackParamList>();
const ForemanStack = createStackNavigator<ForemanStackParamList>();
const FarmStack = createStackNavigator<FarmStackParamList>();
const SupplyStack = createStackNavigator<SupplyStackParamList>();

function WorkerNavigator({ user }: { user: AppUser }) {
  return (
    <WorkerStack.Navigator screenOptions={{ headerShown: false }}>
      <WorkerStack.Screen name="WorkerHome">
        {(props) => <WorkerHome {...props} user={user} />}
      </WorkerStack.Screen>
      <WorkerStack.Screen name="QRScanner">
        {(props) => <QRScanner {...props} user={user} />}
      </WorkerStack.Screen>
      <WorkerStack.Screen name="ShiftHistory">
        {(props) => <ShiftHistory {...props} user={user} />}
      </WorkerStack.Screen>
      <WorkerStack.Screen name="PaymentHistory">
        {(props) => <PaymentHistory {...props} user={user} />}
      </WorkerStack.Screen>
    </WorkerStack.Navigator>
  );
}

function ForemanNavigator({ user }: { user: AppUser }) {
  return (
    <ForemanStack.Navigator screenOptions={{ headerShown: false }}>
      <ForemanStack.Screen name="ForemanHome">
        {(props) => <ForemanHome {...props} user={user} />}
      </ForemanStack.Screen>
      <ForemanStack.Screen name="CreateShift">
        {(props) => <CreateShift {...props} user={user} />}
      </ForemanStack.Screen>
      <ForemanStack.Screen name="WorkerList">
        {(props) => <WorkerList {...props} />}
      </ForemanStack.Screen>
      <ForemanStack.Screen name="CloseShift">
        {(props) => <CloseShift {...props} />}
      </ForemanStack.Screen>
    </ForemanStack.Navigator>
  );
}

function FarmNavigator({ user }: { user: AppUser }) {
  return (
    <FarmStack.Navigator screenOptions={{ headerShown: false }}>
      <FarmStack.Screen name="FarmHome">
        {(props) => <FarmHome {...props} user={user} />}
      </FarmStack.Screen>
      <FarmStack.Screen name="LotList">
        {(props) => <LotList {...props} user={user} />}
      </FarmStack.Screen>
      <FarmStack.Screen name="LotDetail">
        {(props) => <LotDetail {...props} />}
      </FarmStack.Screen>
      <FarmStack.Screen name="Payroll">
        {(props) => <Payroll {...props} />}
      </FarmStack.Screen>
    </FarmStack.Navigator>
  );
}

function SupplyNavigator({ user }: { user: AppUser }) {
  return (
    <SupplyStack.Navigator screenOptions={{ headerShown: false }}>
      <SupplyStack.Screen name="CustodyTransfer">
        {(props) => <CustodyTransfer {...props} user={user} />}
      </SupplyStack.Screen>
      <SupplyStack.Screen name="LotProvenance">
        {(props) => <LotProvenance {...props} />}
      </SupplyStack.Screen>
    </SupplyStack.Navigator>
  );
}

// ------------------------------------------------------------------ role definitions

interface RoleDef {
  role: Role;
  label: string;
  icon: string;
  description: string;
  color: string;
  // Hardcoded dev IDs — in production these come from auth
  userId: string;
  farmId: string;
}

const ROLES: RoleDef[] = [
  {
    role: 'worker',
    label: 'Trabajador',
    icon: '👷',
    description: 'Registra asistencia y consulta pagos',
    color: colors.forest,
    userId: 'worker-001',
    farmId: 'farm-001',
  },
  {
    role: 'foreman',
    label: 'Capataz',
    icon: '📋',
    description: 'Crea turnos y gestiona trabajadores',
    color: colors.coffeeBrown,
    userId: 'foreman-001',
    farmId: 'farm-001',
  },
  {
    role: 'farm_owner',
    label: 'Propietario',
    icon: '🌾',
    description: 'Gestiona la finca y nómina',
    color: colors.coffeeDark,
    userId: 'owner-001',
    farmId: 'farm-001',
  },
  {
    role: 'mill_operator',
    label: 'Beneficiador',
    icon: '💧',
    description: 'Procesa y transfiere lotes de café',
    color: colors.info,
    userId: 'mill-001',
    farmId: 'farm-001',
  },
  {
    role: 'exporter',
    label: 'Exportador',
    icon: '🚢',
    description: 'Agrega lotes y genera documentos',
    color: colors.coffeeMedium,
    userId: 'exporter-001',
    farmId: 'farm-001',
  },
  {
    role: 'roaster',
    label: 'Tostador',
    icon: '🔥',
    description: 'Verifica origen y registra tueste',
    color: colors.lightning,
    userId: 'roaster-001',
    farmId: 'farm-001',
  },
];

// ------------------------------------------------------------------ login screen

function LoginScreen({ onLogin }: { onLogin: (user: AppUser) => void }) {
  return (
    <SafeAreaView style={loginStyles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={loginStyles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={loginStyles.header}>
          <Text style={loginStyles.logo}>☕</Text>
          <Text style={loginStyles.title}>Chainbytes Coffee</Text>
          <Text style={loginStyles.subtitle}>Cadena de Suministro de Café</Text>
          <View style={loginStyles.devBadge}>
            <Text style={loginStyles.devBadgeText}>MODO DESARROLLO</Text>
          </View>
        </View>

        <Text style={loginStyles.sectionLabel}>Selecciona tu rol</Text>

        {/* Role cards */}
        {ROLES.map((role) => (
          <Pressable
            key={role.role}
            style={({ pressed }) => [
              loginStyles.roleCard,
              { borderLeftColor: role.color, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() =>
              onLogin({
                id: role.userId,
                name: getRoleName(role.role),
                role: role.role,
                farmId: role.farmId,
              })
            }
          >
            <View style={[loginStyles.roleIcon, { backgroundColor: role.color }]}>
              <Text style={loginStyles.roleEmoji}>{role.icon}</Text>
            </View>
            <View style={loginStyles.roleText}>
              <Text style={loginStyles.roleLabel}>{role.label}</Text>
              <Text style={loginStyles.roleDesc}>{role.description}</Text>
            </View>
            <Text style={loginStyles.roleArrow}>›</Text>
          </Pressable>
        ))}

        <Text style={loginStyles.footer}>
          Prototipo Fase 1 · Red Liquid (testnet) · Lightning Network
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function getRoleName(role: Role): string {
  const names: Record<Role, string> = {
    worker: 'María López',
    foreman: 'Carlos Méndez',
    farm_owner: 'Ana Rodríguez',
    mill_operator: 'José García',
    exporter: 'Pedro Hernández',
    roaster: 'Luis Martínez',
  };
  return names[role];
}

// ------------------------------------------------------------------ root app

export default function App(): React.ReactElement {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
    void Font.loadAsync({
      DMSans_400Regular,
      DMSans_500Medium,
      DMSans_600SemiBold,
      DMSans_700Bold,
    }).then(() => setFontsLoaded(true));
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashEmoji}>☕</Text>
        <ActivityIndicator color={colors.coffeeLight} size="large" style={{ marginTop: spacing.lg }} />
      </View>
    );
  }

  if (!user) {
    return (
      <SafeAreaProvider>
        <LoginScreen onLogin={setUser} />
      </SafeAreaProvider>
    );
  }

  const renderNavigator = () => {
    switch (user.role) {
      case 'worker':
        return <WorkerNavigator user={user} />;
      case 'foreman':
        return <ForemanNavigator user={user} />;
      case 'farm_owner':
        return <FarmNavigator user={user} />;
      case 'mill_operator':
      case 'exporter':
      case 'roaster':
        return <SupplyNavigator user={user} />;
      default:
        return <WorkerNavigator user={user} />;
    }
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {renderNavigator()}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// ------------------------------------------------------------------ styles

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.coffeeDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashEmoji: {
    fontSize: 64,
  },
});

const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.coffeeDark,
  },
  scroll: {
    padding: spacing.xl,
    paddingBottom: spacing.huge,
    gap: spacing.md,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.sm,
  },
  logo: {
    fontSize: 72,
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.hero,
    color: colors.cream,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body,
    color: colors.coffeeLight,
    textAlign: 'center',
  },
  devBadge: {
    backgroundColor: colors.lightning,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    marginTop: spacing.sm,
  },
  devBadgeText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    color: colors.white,
    letterSpacing: 1.5,
  },
  sectionLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: colors.coffeeLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,248,231,0.08)',
    borderRadius: radius.lg,
    borderLeftWidth: 4,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.sm,
  },
  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleEmoji: {
    fontSize: 22,
  },
  roleText: {
    flex: 1,
    gap: 2,
  },
  roleLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.body,
    color: colors.cream,
  },
  roleDesc: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.coffeeLight,
    lineHeight: 18,
  },
  roleArrow: {
    fontSize: 22,
    color: colors.coffeeLight,
  },
  footer: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.coffeeLight,
    textAlign: 'center',
    opacity: 0.6,
    marginTop: spacing.lg,
  },
});
