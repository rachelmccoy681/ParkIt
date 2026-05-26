import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import * as authApi from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { AuthStackParams } from '../../navigation/AuthStack';
import { colors, gradients, radius, shadows, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParams, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) return;
    setLoading(true);
    try {
      const res = await authApi.login(username, password);
      await login(res.data);
    } catch (err: any) {
      const msg = err.response?.data?.error
        ?? (err.response ? 'Login failed' : 'Cannot reach server — check your connection');
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bg}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <LinearGradient colors={gradients.avatar} style={styles.brandIcon}>
              <Text style={styles.brandIconText}>P</Text>
            </LinearGradient>
            <Text style={styles.brandName}>ParkIt</Text>
            <Text style={styles.brandSub}>Smart Parking for Everyone</Text>
          </View>

          <View style={[styles.card, shadows.md]}>
            <Text style={styles.cardTitle}>Welcome back</Text>

            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="your username"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              value={username}
              onChangeText={setUsername}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotRow}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
              <LinearGradient colors={gradients.primaryHorizontal} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGradient}>
                <Text style={styles.btnText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.footerLink}>
            <Text style={styles.footerText}>
              Don't have an account?{' '}
              <Text style={styles.footerAccent}>Register</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  circle1: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -80, right: -80,
  },
  circle2: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)', bottom: 60, left: -60,
  },

  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },

  brand: { alignItems: 'center', marginBottom: spacing.xl },
  brandIcon: {
    width: 72, height: 72, borderRadius: radius.xl,
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md,
  },
  brandIconText: { fontSize: 36, fontWeight: '800', color: colors.primaryDark },
  brandName: { fontSize: 32, fontWeight: '800', color: colors.textInverse, letterSpacing: 0.5 },
  brandSub: { ...typography.caption, color: 'rgba(255,255,255,0.7)', marginTop: spacing.xs },

  card: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: spacing.lg, marginBottom: spacing.lg,
  },
  cardTitle: { ...typography.h2, marginBottom: spacing.lg, textAlign: 'center' },

  label: { ...typography.label, marginBottom: spacing.xs },
  input: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
    padding: spacing.md, ...typography.body, marginBottom: spacing.md,
    backgroundColor: colors.background,
  },

  forgotRow: { alignItems: 'flex-end', marginBottom: spacing.md, marginTop: -spacing.sm },
  forgotText: { ...typography.caption, color: colors.primary, fontWeight: '600' },

  btn: { borderRadius: radius.md, overflow: 'hidden', marginTop: spacing.xs },
  btnGradient: { padding: spacing.md, alignItems: 'center' },
  btnText: { ...typography.button },

  footerLink: { alignItems: 'center' },
  footerText: { ...typography.body, color: 'rgba(255,255,255,0.8)' },
  footerAccent: { color: colors.textInverse, fontWeight: '700' },
});
