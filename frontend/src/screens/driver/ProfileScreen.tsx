import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  Alert, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as usersApi from '../../api/users';
import * as vehiclesApi from '../../api/vehicles';
import * as bookingsApi from '../../api/bookings';
import { useAuth } from '../../context/AuthContext';
import { ProfileStackParams } from '../../navigation/DriverTabs';
import { colors, gradients, radius, shadows, spacing, typography } from '../../theme';
import { VehicleResponse } from '../../types';

type Props = NativeStackScreenProps<ProfileStackParams, 'ProfileHome'>;

const VEHICLE_ICONS: Record<string, string> = { GAS: '⛽', EV: '⚡', HYBRID: '🔋' };
const VEHICLE_COLORS: Record<string, string> = {
  GAS: colors.vehicleGas, EV: colors.vehicleEv, HYBRID: colors.vehicleHybrid,
};

function VehicleChip({ v, onRemove }: { v: VehicleResponse; onRemove: () => void }) {
  const icon = VEHICLE_ICONS[v.vehicleType];
  const color = VEHICLE_COLORS[v.vehicleType];
  return (
    <View style={[styles.vehicleChip, { borderColor: color + '40', backgroundColor: color + '15' }]}>
      <Text style={styles.chipIcon}>{icon}</Text>
      <View style={styles.chipInfo}>
        <Text style={styles.chipName}>{v.make} {v.model}</Text>
        <Text style={[styles.chipPlate, { color }]}>{v.plateNumber}</Text>
      </View>
      <TouchableOpacity style={styles.chipRemove} onPress={onRemove}>
        <Text style={styles.chipRemoveText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

function SettingsRow({ icon, label, onPress, danger }: { icon: string; label: string; onPress?: () => void; danger?: boolean }) {
  return (
    <TouchableOpacity style={styles.settingsRow} onPress={onPress} disabled={!onPress}>
      <View style={[styles.settingsIcon, danger && styles.settingsIconDanger]}>
        <Text style={styles.settingsIconText}>{icon}</Text>
      </View>
      <Text style={[styles.settingsLabel, danger && styles.settingsLabelDanger]}>{label}</Text>
      {onPress && <Text style={styles.settingsChevron}>›</Text>}
    </TouchableOpacity>
  );
}

type ModalType = 'email' | 'password' | 'username' | null;

export default function ProfileScreen({ navigation }: Props) {
  const { userId, email: authEmail, logout } = useAuth();
  const [username, setUsername] = useState('');
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [bookingCount, setBookingCount] = useState(0);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [saving, setSaving] = useState(false);

  useFocusEffect(useCallback(() => {
    if (!userId) return;
    usersApi.getUser(userId).then(res => setUsername(res.data.username)).catch(() => {});
    vehiclesApi.getMyVehicles().then(res => setVehicles(res.data)).catch(() => {});
    bookingsApi.getActiveBookings(userId).then(res => setBookingCount(res.data.length)).catch(() => {});
  }, [userId]));

  const handleRemoveVehicle = (vehicleId: string) => {
    Alert.alert('Remove Vehicle', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          try {
            await vehiclesApi.removeVehicle(vehicleId);
            setVehicles(prev => prev.filter(v => v.vehicleId !== vehicleId));
          } catch {
            Alert.alert('Error', 'Could not remove vehicle');
          }
        },
      },
    ]);
  };

  const handleSaveEmail = async () => {
    if (!userId || !newEmail.trim()) return;
    setSaving(true);
    try {
      await usersApi.updateEmail(userId, newEmail.trim());
      Alert.alert('Updated', 'Email updated successfully.');
      setModalType(null);
      setNewEmail('');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error ?? 'Could not update email');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveUsername = async () => {
    if (!userId || !newUsername.trim()) return;
    setSaving(true);
    try {
      await usersApi.updateUsername(userId, newUsername.trim());
      setUsername(newUsername.trim());
      Alert.alert('Updated', 'Username updated successfully.');
      setModalType(null);
      setNewUsername('');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error ?? 'Could not update username');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (!userId || !newPassword.trim()) return;
    setSaving(true);
    try {
      await usersApi.updatePassword(userId, newPassword.trim());
      Alert.alert('Updated', 'Password updated successfully.');
      setModalType(null);
      setNewPassword('');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error ?? 'Could not update password');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  const displayName = username || authEmail?.split('@')[0] || 'User';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />

        <View style={[styles.avatarWrapper, shadows.avatar]}>
          <LinearGradient colors={gradients.avatar} style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
          </LinearGradient>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{authEmail}</Text>

        <View style={styles.stats}>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{vehicles.length}</Text>
            <Text style={styles.statLabel}>Vehicles</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{bookingCount}</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>

        <Text style={styles.sectionTitle}>My Vehicles</Text>
        {vehicles.map(v => (
          <VehicleChip key={v.vehicleId} v={v} onRemove={() => handleRemoveVehicle(v.vehicleId)} />
        ))}
        {vehicles.length === 0 && (
          <Text style={styles.emptyVehicles}>No vehicles yet. Add one below.</Text>
        )}
        <TouchableOpacity style={styles.addVehicleButton} onPress={() => navigation.navigate('VehicleList')} activeOpacity={0.85}>
          <LinearGradient
            colors={gradients.primaryHorizontal}
            style={styles.addVehicleGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.addVehicleText}>Manage Vehicles</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.settingsCard}>
          <SettingsRow icon="👤" label="Change Username" onPress={() => setModalType('username')} />
          <View style={styles.settingsDivider} />
          <SettingsRow icon="✉️" label="Change Email" onPress={() => setModalType('email')} />
          <View style={styles.settingsDivider} />
          <SettingsRow icon="🔒" label="Change Password" onPress={() => setModalType('password')} />
        </View>

        <View style={styles.settingsCard}>
          <SettingsRow icon="🚪" label="Log Out" onPress={handleLogout} danger />
        </View>

      </ScrollView>

      <Modal visible={modalType !== null} transparent animationType="slide" onRequestClose={() => setModalType(null)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
            {modalType === 'username' ? 'Change Username' : modalType === 'email' ? 'Change Email' : 'Change Password'}
          </Text>

            {modalType === 'username' ? (
              <>
                <Text style={styles.modalLabel}>New Username</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="new username"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={newUsername}
                  onChangeText={setNewUsername}
                />
              </>
            ) : modalType === 'email' ? (
              <>
                <Text style={styles.modalLabel}>New Email</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="new@example.com"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={newEmail}
                  onChangeText={setNewEmail}
                />
              </>
            ) : (
              <>
                <Text style={styles.modalLabel}>New Password</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Min 8 chars, A-Z, 0-9, special"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setModalType(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSave}
                onPress={modalType === 'username' ? handleSaveUsername : modalType === 'email' ? handleSaveEmail : handleSavePassword}
                disabled={saving}
              >
                <Text style={styles.modalSaveText}>{saving ? 'Saving…' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: { paddingTop: 60, paddingBottom: spacing.lg, alignItems: 'center', overflow: 'hidden' },
  decorCircle1: {
    position: 'absolute', width: 180, height: 180, borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -40, right: -40,
  },
  decorCircle2: {
    position: 'absolute', width: 120, height: 120, borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.06)', bottom: -20, left: -20,
  },

  avatarWrapper: { marginBottom: spacing.md },
  avatar: { width: 80, height: 80, borderRadius: radius.full, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 32, fontWeight: '800', color: colors.primaryDark },
  name: { ...typography.h2, color: colors.textInverse, letterSpacing: 0.3 },
  email: { ...typography.caption, color: 'rgba(255,255,255,0.7)', marginTop: spacing.xs, marginBottom: spacing.lg },

  stats: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
  },
  statPill: { alignItems: 'center', paddingHorizontal: spacing.lg },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.textInverse },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.2)' },

  body: { flex: 1 },
  bodyContent: { padding: spacing.lg, paddingBottom: spacing.xxl },

  sectionTitle: { ...typography.label, marginBottom: spacing.md, marginTop: spacing.xs },

  vehicleChip: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.sm, gap: spacing.md,
  },
  chipIcon: { fontSize: 26 },
  chipInfo: { flex: 1 },
  chipName: { ...typography.bodySemiBold },
  chipPlate: { ...typography.caption, fontWeight: '600', marginTop: 2 },
  chipRemove: { marginLeft: 'auto', padding: spacing.xs },
  chipRemoveText: { fontSize: 14, color: colors.textMuted },

  emptyVehicles: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm },

  addVehicleButton: { borderRadius: radius.md, overflow: 'hidden', marginBottom: spacing.lg },
  addVehicleGradient: { padding: spacing.md, alignItems: 'center' },
  addVehicleText: { ...typography.button },

  settingsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg, marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  settingsRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  settingsIcon: {
    width: 36, height: 36, borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  settingsIconDanger: { backgroundColor: '#FEE2E2' },
  settingsIconText: { fontSize: 18 },
  settingsLabel: { ...typography.bodyMedium, flex: 1 },
  settingsLabelDanger: { color: colors.danger },
  settingsChevron: { fontSize: 20, color: colors.primaryMuted },
  settingsDivider: { height: 1, backgroundColor: colors.borderLight, marginHorizontal: spacing.md },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: spacing.lg, paddingBottom: spacing.xxl,
  },
  modalTitle: { ...typography.h3, marginBottom: spacing.lg },
  modalLabel: { ...typography.label, marginBottom: spacing.xs },
  modalInput: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
    padding: spacing.md, ...typography.body, marginBottom: spacing.lg,
    backgroundColor: colors.background,
  },
  modalButtons: { flexDirection: 'row', gap: spacing.md },
  modalCancel: {
    flex: 1, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md, alignItems: 'center',
  },
  modalCancelText: { ...typography.button, color: colors.textSecondary },
  modalSave: {
    flex: 1, backgroundColor: colors.primary,
    borderRadius: radius.md, padding: spacing.md, alignItems: 'center',
  },
  modalSaveText: { ...typography.button },
});
