import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import * as usersApi from '../../api/users';
import { AdminStackParams } from '../../navigation/AdminStack';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { UserResponse } from '../../types';

type Props = NativeStackScreenProps<AdminStackParams, 'UserManagement'>;

export default function UserManagementScreen({ }: Props) {
  const [searchEmail, setSearchEmail] = useState('');
  const [user, setUser] = useState<UserResponse | null>(null);
  const [searching, setSearching] = useState(false);
  const [actioning, setActioning] = useState(false);

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    setSearching(true);
    setUser(null);
    try {
      const res = await usersApi.getUserByEmail(searchEmail.trim());
      setUser(res.data);
    } catch {
      Alert.alert('Not Found', 'No user found with that email address.');
    } finally {
      setSearching(false);
    }
  };

  const handleSuspend = () => {
    if (!user) return;
    Alert.alert('Suspend User', `Suspend ${user.username}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Suspend', style: 'destructive', onPress: async () => {
          setActioning(true);
          try {
            await usersApi.suspendUser(user.userId);
            setUser({ ...user, active: false });
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.error ?? 'Could not suspend user');
          } finally {
            setActioning(false);
          }
        },
      },
    ]);
  };

  const handleReactivate = async () => {
    if (!user) return;
    setActioning(true);
    try {
      await usersApi.reactivateUser(user.userId);
      setUser({ ...user, active: true });
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error ?? 'Could not reactivate user');
    } finally {
      setActioning(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <View style={[styles.searchCard, shadows.sm]}>
          <Text style={styles.sectionTitle}>Find User</Text>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="user@example.com"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={searchEmail}
            onChangeText={setSearchEmail}
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={searching} activeOpacity={0.85}>
            <Text style={styles.searchBtnText}>{searching ? 'Searching…' : '🔍 Search'}</Text>
          </TouchableOpacity>
        </View>

        {user && (
          <View style={[styles.userCard, shadows.md]}>
            <View style={styles.userHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user.username.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.username}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: user.active ? colors.success + '20' : colors.danger + '20' }]}>
                <Text style={[styles.statusText, { color: user.active ? colors.success : colors.danger }]}>
                  {user.active ? 'Active' : 'Suspended'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>User ID</Text>
                <Text style={styles.detailValue}>#{user.userId.slice(-8).toUpperCase()}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Verified</Text>
                <Text style={[styles.detailValue, { color: user.emailVerified ? colors.success : colors.warning }]}>
                  {user.emailVerified ? 'Yes' : 'No'}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Joined</Text>
                <Text style={styles.detailValue}>
                  {new Date(user.registeredDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.actions}>
              {user.active ? (
                <TouchableOpacity style={styles.suspendBtn} onPress={handleSuspend} disabled={actioning} activeOpacity={0.85}>
                  <Text style={styles.suspendBtnText}>{actioning ? 'Processing…' : '🚫 Suspend User'}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.reactivateBtn} onPress={handleReactivate} disabled={actioning} activeOpacity={0.85}>
                  <Text style={styles.reactivateBtnText}>{actioning ? 'Processing…' : '✅ Reactivate User'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },

  searchCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg },
  sectionTitle: { ...typography.h3, marginBottom: spacing.md },

  label: { ...typography.label, marginBottom: spacing.xs },
  input: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
    padding: spacing.md, ...typography.body, marginBottom: spacing.md,
    backgroundColor: colors.background,
  },
  searchBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    padding: spacing.md, alignItems: 'center',
  },
  searchBtnText: { ...typography.button },

  userCard: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden' },
  userHeader: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  avatar: {
    width: 52, height: 52, borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { ...typography.h2, color: colors.primary },
  userInfo: { flex: 1 },
  userName: { ...typography.bodySemiBold },
  userEmail: { ...typography.caption, marginTop: 2 },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full },
  statusText: { fontSize: 12, fontWeight: '700' },

  divider: { height: 1, backgroundColor: colors.borderLight },

  detailsGrid: { flexDirection: 'row', padding: spacing.md },
  detailItem: { flex: 1, alignItems: 'center' },
  detailLabel: { ...typography.label, marginBottom: spacing.xs },
  detailValue: { ...typography.bodyMedium, textAlign: 'center' },

  actions: { padding: spacing.md },
  suspendBtn: {
    borderWidth: 1.5, borderColor: colors.danger,
    borderRadius: radius.md, padding: spacing.md, alignItems: 'center',
  },
  suspendBtnText: { ...typography.button, color: colors.danger },
  reactivateBtn: {
    backgroundColor: colors.success,
    borderRadius: radius.md, padding: spacing.md, alignItems: 'center',
  },
  reactivateBtnText: { ...typography.button },
});
