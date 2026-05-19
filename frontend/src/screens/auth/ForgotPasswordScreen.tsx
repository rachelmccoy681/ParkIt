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

type Props = NativeStackScreenProps<AuthStackParams, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
    } catch {
      // no-op: never reveal whether email exists
    } finally {
      setLoading(false);
      Alert.alert(
        'Code Sent',
        'If that address is registered, a reset code has been sent.',
        [{ text: 'Continue', onPress: () => navigation.navigate('ResetPassword', { email }) }],
      );
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
              <Text style={styles.iconBadgeText}>🔑</Text>
            </View>
            <Text style={styles.brandName}>Forgot Password?</Text>
            <Text style={styles.brandSub}>We'll send a reset code to your email</Text>
          </View>

          <View style={[styles.card, shadows.md]}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
              <LinearGradient colors={gradients.primaryHorizontal} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGradient}>
                <Text style={styles.btnText}>{loading ? 'Sending…' : 'Send Reset Code'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.footerLink}>
            <Text style={styles.footerText}>
              Back to{' '}
              <Text style={styles.footerAccent}>Sign In</Text>
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
  input: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
    padding: spacing.md, ...typography.body, marginBottom: spacing.md,
    backgroundColor: colors.background,
  },

  btn: { borderRadius: radius.md, overflow: 'hidden', marginTop: spacing.xs },
  btnGradient: { padding: spacing.md, alignItems: 'center' },
  btnText: { ...typography.button },

  footerLink: { alignItems: 'center' },
  footerText: { ...typography.body, color: 'rgba(255,255,255,0.8)' },
  footerAccent: { color: colors.textInverse, fontWeight: '700' },
});
