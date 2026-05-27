import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import * as authApi from '../../api/auth';
import { AuthStackParams } from '../../navigation/AuthStack';
import { colors, gradients, radius, shadows, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParams, 'ResetPassword'>;

export default function ResetPasswordScreen({ navigation, route }: Props) {
  const { email } = route.params;
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!code || !newPassword) return;
    setLoading(true);
    try {
      await authApi.resetPassword(email, code, newPassword);
      Alert.alert('Password Reset!', 'You can now sign in with your new password.', [
        { text: 'Sign In', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error ?? 'Reset failed');
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
            <View style={styles.iconBadge}>
              <Text style={styles.iconBadgeText}>🔒</Text>
            </View>
            <Text style={styles.brandName}>Reset Password</Text>
            <Text style={styles.brandSub}>Enter the code sent to {email}</Text>
          </View>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.footerLink}>
            <Text style={styles.footerText}>
              Wrong email?{' '}
              <Text style={styles.footerAccent}>Back to Forgot Password</Text>
            </Text>
          </TouchableOpacity>

          <View style={[styles.card, shadows.md]}>
            <Text style={styles.label}>Reset Code</Text>
            <TextInput
              style={styles.codeInput}
              placeholder="000000"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={6}
              value={code}
              onChangeText={setCode}
            />

            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Min 8 chars, A-Z, 0-9, special"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <TouchableOpacity style={styles.btn} onPress={handleReset} disabled={loading} activeOpacity={0.85}>
              <LinearGradient colors={gradients.primaryHorizontal} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGradient}>
                <Text style={styles.btnText}>{loading ? 'Resetting…' : 'Reset Password'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
  iconBadge: {
    width: 80, height: 80, borderRadius: radius.xl,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md,
  },
  iconBadgeText: { fontSize: 40 },
  brandName: { fontSize: 24, fontWeight: '800', color: colors.textInverse, marginBottom: spacing.xs },
  brandSub: { ...typography.caption, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },

  card: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: spacing.lg, marginBottom: spacing.lg,
  },

  label: { ...typography.label, marginBottom: spacing.xs },
  codeInput: {
    borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.md,
    padding: spacing.md, textAlign: 'center', fontSize: 28,
    fontWeight: '700', letterSpacing: 10, color: colors.textPrimary,
    backgroundColor: colors.background, marginBottom: spacing.md,
  },
  input: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
    padding: spacing.md, ...typography.body, marginBottom: spacing.md,
    backgroundColor: colors.background,
  },

  btn: { borderRadius: radius.md, overflow: 'hidden', marginTop: spacing.xs },
  btnGradient: { padding: spacing.md, alignItems: 'center' },
  btnText: { ...typography.button },

  footerLink: { alignItems: 'center', marginBottom: spacing.md },
  footerText: { ...typography.body, color: 'rgba(255,255,255,0.8)' },
  footerAccent: { color: colors.textInverse, fontWeight: '700' },
});
