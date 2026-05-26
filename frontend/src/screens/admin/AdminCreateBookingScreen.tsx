import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import * as bookingsApi from '../../api/bookings';
import * as lotsApi from '../../api/lots';
import * as usersApi from '../../api/users';
import * as vehiclesApi from '../../api/vehicles';
import SpotPickerModal from '../../components/SpotPickerModal';
import { AdminStackParams } from '../../navigation/AdminStack';
import { colors, gradients, radius, shadows, spacing, typography } from '../../theme';
import { ParkingFloorResponse, ParkingLotResponse, ParkingSpotResponse, UserResponse, VehicleResponse } from '../../types';
import { buildStartOptions } from '../../utils/bookingUtils';

type Props = NativeStackScreenProps<AdminStackParams, 'AdminCreateBooking'>;

const DURATION_OPTIONS = [1, 2, 3, 4, 6, 8, 12, 24];
const VEHICLE_ICONS: Record<string, string> = { GAS: '⛽', EV: '⚡', HYBRID: '🔋' };

export default function AdminCreateBookingScreen({ navigation }: Props) {
  // User search
  const [emailInput, setEmailInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [targetUser, setTargetUser] = useState<UserResponse | null>(null);
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);

  // Booking details
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedSpotId, setSelectedSpotId] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [selectedStartIso, setSelectedStartIso] = useState('');

  // Spot picker
  const [spotModalVisible, setSpotModalVisible] = useState(false);
  const [lots, setLots] = useState<ParkingLotResponse[]>([]);
  const [floorsByLot, setFloorsByLot] = useState<Record<string, ParkingFloorResponse[]>>({});
  const [spotsByFloor, setSpotsByFloor] = useState<Record<string, ParkingSpotResponse[]>>({});
  const [selectedFloorId, setSelectedFloorId] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const startOptions = buildStartOptions();

  const handleSearchUser = async () => {
    if (!emailInput.trim()) return;
    setSearching(true);
    setTargetUser(null);
    setVehicles([]);
    setSelectedVehicleId('');
    try {
      const userRes = await usersApi.getUserByEmail(emailInput.trim());
      setTargetUser(userRes.data);
      const vRes = await vehiclesApi.getUserVehicles(userRes.data.userId);
      setVehicles(vRes.data);
    } catch {
      Alert.alert('Not Found', 'No user found with that email address.');
    } finally {
      setSearching(false);
    }
  };

  const openSpotPicker = async () => {
    if (lots.length === 0) {
      try {
        const lotsRes = await lotsApi.getLots();
        setLots(lotsRes.data);
        const floorMap: Record<string, ParkingFloorResponse[]> = {};
        await Promise.all(lotsRes.data.map(async lot => {
          const fr = await lotsApi.getFloors(lot.lotId);
          floorMap[lot.lotId] = fr.data;
        }));
        setFloorsByLot(floorMap);
        const firstFloor = Object.values(floorMap).flat()[0];
        if (firstFloor) {
          setSelectedFloorId(firstFloor.floorId);
          await loadSpots(firstFloor.floorId);
        }
      } catch {
        Alert.alert('Error', 'Could not load lots');
        return;
      }
    }
    setSpotModalVisible(true);
  };

  const loadSpots = async (floorId: string) => {
    if (spotsByFloor[floorId]) return;
    try {
      const res = await lotsApi.getSpots(floorId);
      setSpotsByFloor(prev => ({ ...prev, [floorId]: res.data }));
    } catch {}
  };

  const handleSelectFloor = async (floorId: string) => {
    setSelectedFloorId(floorId);
    await loadSpots(floorId);
  };

  const allFloors = Object.values(floorsByLot).flat();
  const currentSpots = spotsByFloor[selectedFloorId] ?? [];
  const selectedSpot = Object.values(spotsByFloor).flat().find(s => s.spotId === selectedSpotId);
  const hourlyRate = selectedSpot?.hourlyRate ?? 0;

  const canSubmit = !!targetUser && !!selectedVehicleId && !!selectedSpotId && !!selectedStartIso;

  const handleSubmit = async () => {
    setSubmitted(true);
    if (!canSubmit || !targetUser) return;
    setSubmitting(true);
    try {
      await bookingsApi.adminCreateBooking({
        userId: targetUser.userId,
        spotId: selectedSpotId,
        vehicleId: selectedVehicleId,
        startTime: selectedStartIso,
        durationMinutes: selectedDuration * 60,
      });
      Alert.alert('Created', 'Booking created successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error ?? 'Could not create booking');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* Step 1: Find User */}
        <Text style={styles.sectionTitle}>Find User</Text>
        <View style={[styles.card, shadows.sm, submitted && !targetUser && styles.cardError]}>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="User email address"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={emailInput}
              onChangeText={setEmailInput}
              returnKeyType="search"
              onSubmitEditing={handleSearchUser}
            />
            <TouchableOpacity style={styles.searchBtn} onPress={handleSearchUser} disabled={searching} activeOpacity={0.85}>
              <Text style={styles.searchBtnText}>{searching ? '…' : 'Find'}</Text>
            </TouchableOpacity>
          </View>
          {targetUser && (
            <View style={styles.userFound}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>{(targetUser.username || targetUser.email).charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{targetUser.username}</Text>
                <Text style={styles.userEmail}>{targetUser.email}</Text>
              </View>
              <View style={[styles.userActiveBadge, { backgroundColor: targetUser.active ? colors.success + '20' : colors.danger + '20' }]}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: targetUser.active ? colors.success : colors.danger }}>
                  {targetUser.active ? 'Active' : 'Suspended'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Step 2: Vehicle */}
        {targetUser && (
          <>
            <Text style={styles.sectionTitle}>Vehicle</Text>
            {vehicles.length === 0 ? (
              <Text style={styles.emptyNote}>This user has no registered vehicles.</Text>
            ) : (
              <View style={[styles.card, shadows.sm, submitted && !selectedVehicleId && styles.cardError]}>
                {vehicles.map((v, i) => (
                  <View key={v.vehicleId}>
                    <TouchableOpacity
                      style={[styles.vehicleRow, selectedVehicleId === v.vehicleId && styles.vehicleRowSelected]}
                      onPress={() => setSelectedVehicleId(v.vehicleId)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.vehicleIcon}>{VEHICLE_ICONS[v.vehicleType]}</Text>
                      <View style={styles.vehicleInfo}>
                        <Text style={styles.vehicleName}>{v.make} {v.model}</Text>
                        <Text style={styles.vehiclePlate}>{v.plateNumber}</Text>
                      </View>
                      {selectedVehicleId === v.vehicleId && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                    {i < vehicles.length - 1 && <View style={styles.rowDivider} />}
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* Step 3: Spot */}
        <Text style={styles.sectionTitle}>Spot</Text>
        <TouchableOpacity
          style={[styles.card, shadows.sm, styles.spotPickerBtn, submitted && !selectedSpotId && styles.cardError]}
          onPress={openSpotPicker}
          activeOpacity={0.85}
        >
          <Text style={styles.spotPickerLabel}>
            {selectedSpotId ? `Spot #${selectedSpotId.slice(-6).toUpperCase()}` : 'Tap to select a spot'}
          </Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {/* Step 4: Duration */}
        <Text style={styles.sectionTitle}>Duration</Text>
        <View style={styles.chipRow}>
          {DURATION_OPTIONS.map(h => (
            <TouchableOpacity
              key={h}
              style={[styles.chip, selectedDuration === h && styles.chipActive]}
              onPress={() => setSelectedDuration(h)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, selectedDuration === h && styles.chipTextActive]}>{h}h</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Step 5: Start time */}
        <Text style={styles.sectionTitle}>Start Time</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.startScroll}>
          {startOptions.map(o => (
            <TouchableOpacity
              key={o.iso}
              style={[styles.startChip, selectedStartIso === o.iso && styles.startChipActive, submitted && !selectedStartIso && styles.startChipError]}
              onPress={() => setSelectedStartIso(o.iso)}
              activeOpacity={0.8}
            >
              <Text style={[styles.startChipText, selectedStartIso === o.iso && styles.startChipTextActive]}>
                {o.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Summary */}
        {selectedSpotId && selectedStartIso && (
          <View style={[styles.summaryCard, shadows.sm]}>
            <Text style={styles.summaryLabel}>${hourlyRate.toFixed(2)}/h × {selectedDuration}h</Text>
            <Text style={styles.summaryTotal}>${(hourlyRate * selectedDuration).toFixed(2)}</Text>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={canSubmit ? 0.85 : 1}
        >
          <LinearGradient
            colors={canSubmit ? gradients.primaryHorizontal : [colors.textMuted, colors.textMuted]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.submitBtnInner}
          >
            <Text style={styles.submitBtnText}>{submitting ? 'Creating…' : 'Create Booking'}</Text>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>

      <SpotPickerModal
        visible={spotModalVisible}
        onClose={() => setSpotModalVisible(false)}
        allFloors={allFloors}
        selectedFloorId={selectedFloorId}
        onSelectFloor={handleSelectFloor}
        currentSpots={currentSpots}
        selectedSpotId={selectedSpotId}
        onSelectSpot={setSelectedSpotId}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },

  sectionTitle: { ...typography.label, marginBottom: spacing.sm, marginTop: spacing.md },

  card: { backgroundColor: colors.surface, borderRadius: radius.lg, marginBottom: spacing.sm, overflow: 'hidden' },
  cardError: { borderWidth: 1.5, borderColor: colors.danger },

  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  searchInput: { flex: 1, ...typography.body, color: colors.textPrimary },
  searchBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  searchBtnText: { ...typography.caption, color: colors.textInverse, fontWeight: '700' },

  userFound: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLight },
  userAvatar: {
    width: 40, height: 40, borderRadius: radius.full,
    backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center',
  },
  userAvatarText: { fontSize: 18, fontWeight: '800', color: colors.primary },
  userInfo: { flex: 1 },
  userName: { ...typography.bodySemiBold },
  userEmail: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  userActiveBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full },

  emptyNote: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.md },

  vehicleRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  vehicleRowSelected: { backgroundColor: colors.primaryLight },
  vehicleIcon: { fontSize: 24 },
  vehicleInfo: { flex: 1 },
  vehicleName: { ...typography.bodySemiBold },
  vehiclePlate: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  checkmark: { fontSize: 18, color: colors.primary, fontWeight: '800' },
  rowDivider: { height: 1, backgroundColor: colors.borderLight, marginHorizontal: spacing.md },

  spotPickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md },
  spotPickerLabel: { ...typography.bodySemiBold },
  chevron: { fontSize: 22, color: colors.primaryMuted },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  chipText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: colors.primary },

  startScroll: { marginBottom: spacing.sm },
  startChip: {
    marginRight: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface,
  },
  startChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  startChipError: { borderColor: colors.danger },
  startChipText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  startChipTextActive: { color: colors.primary },

  summaryCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: spacing.md,
  },
  summaryLabel: { ...typography.body, color: colors.textSecondary },
  summaryTotal: { fontSize: 18, fontWeight: '800', color: colors.primary },

  submitBtn: { borderRadius: radius.md, overflow: 'hidden', marginTop: spacing.md },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnInner: { padding: spacing.md, alignItems: 'center' },
  submitBtnText: { ...typography.button },
});
