import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as bookingsApi from '../../api/bookings';
import * as lotsApi from '../../api/lots';
import SpotPickerModal from '../../components/SpotPickerModal';
import { AdminStackParams } from '../../navigation/AdminStack';
import { colors, gradients, radius, shadows, spacing, typography } from '../../theme';
import { BookingResponse, ParkingFloorResponse, ParkingSpotResponse } from '../../types';
import { buildStartOptions, formatDuration } from '../../utils/bookingUtils';

type Props = NativeStackScreenProps<AdminStackParams, 'AdminBookingDetail'>;

const STATUS_CONFIG = {
  PENDING:   { label: 'Pending',   color: colors.warning },
  CONFIRMED: { label: 'Confirmed', color: colors.success },
  CANCELLED: { label: 'Cancelled', color: colors.textMuted },
  EXPIRED:   { label: 'Expired',   color: colors.danger },
  EXTENDED:  { label: 'Extended',  color: colors.info },
};

const DURATION_OPTIONS = [1, 2, 3, 4, 6, 8, 12, 24];

function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
    </View>
  );
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminBookingDetailScreen({ navigation, route }: Props) {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState<BookingResponse | null>(null);

  const [editMode, setEditMode] = useState(false);
  const [floorsByLot, setFloorsByLot] = useState<Record<string, ParkingFloorResponse[]>>({});
  const [spotsByFloor, setSpotsByFloor] = useState<Record<string, ParkingSpotResponse[]>>({});
  const [selectedFloorId, setSelectedFloorId] = useState('');
  const [selectedSpotId, setSelectedSpotId] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [selectedStartIso, setSelectedStartIso] = useState('');
  const [spotModalVisible, setSpotModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const startOptions = buildStartOptions();
  const isActive = booking && ['CONFIRMED', 'PENDING', 'EXTENDED'].includes(booking.status);

  useEffect(() => {
    bookingsApi.getBooking(bookingId)
      .then(res => {
        setBooking(res.data);
        setSelectedSpotId(res.data.spotId);
        setSelectedDuration(res.data.duration / 60);
        setSelectedStartIso(res.data.startTime);
      })
      .catch(() => Alert.alert('Error', 'Could not load booking'));
  }, [bookingId]);

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

  const handleEnterEdit = async () => {
    setEditMode(true);
    try {
      const lotsRes = await lotsApi.getLots();
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
    }
  };

  const handleSaveEdit = async () => {
    if (!booking || !selectedSpotId || !selectedStartIso) return;
    setSaving(true);
    try {
      const res = await bookingsApi.editBooking(bookingId, {
        spotId: selectedSpotId,
        vehicleId: booking.vehicleId,
        startTime: selectedStartIso,
        durationMinutes: selectedDuration * 60,
      });
      setBooking(res.data);
      setEditMode(false);
      Alert.alert('Updated', 'Booking updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error ?? 'Could not update booking');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    Alert.alert('Cancel Booking', 'Soft-cancel this booking?', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel Booking', style: 'destructive', onPress: async () => {
          try {
            await bookingsApi.cancelBooking(bookingId);
            setBooking(prev => prev ? { ...prev, status: 'CANCELLED' } : null);
            setEditMode(false);
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.error ?? 'Could not cancel');
          }
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Booking', 'Permanently delete this booking? This cannot be undone.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await bookingsApi.deleteBooking(bookingId);
            navigation.goBack();
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.error ?? 'Could not delete');
          }
        },
      },
    ]);
  };

  if (!booking) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  const status = STATUS_CONFIG[booking.status];
  const allFloors = Object.values(floorsByLot).flat();
  const currentSpots = spotsByFloor[selectedFloorId] ?? [];
  const selectedSpot = Object.values(spotsByFloor).flat().find(s => s.spotId === selectedSpotId);
  const hourlyRate = selectedSpot?.hourlyRate ?? 0;

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={[styles.statusBadge, { backgroundColor: status.color + '30' }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
        <Text style={styles.spotLabel}>Spot #{booking.spotId.slice(-6).toUpperCase()}</Text>
        <Text style={styles.amountText}>${booking.totalAmount.toFixed(2)}</Text>
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={[styles.card, shadows.sm]}>
          <InfoRow label="Booking ID" value={`#${booking.bookingId.slice(-8).toUpperCase()}`} />
          <View style={styles.divider} />
          <InfoRow label="User ID" value={booking.userId.slice(-8).toUpperCase()} />
          <View style={styles.divider} />
          <InfoRow label="Vehicle ID" value={booking.vehicleId.slice(-8).toUpperCase()} />
          <View style={styles.divider} />
          <InfoRow label="Status" value={status.label} valueColor={status.color} />
          <View style={styles.divider} />
          <InfoRow label="Start Time" value={formatDateTime(booking.startTime)} />
          <View style={styles.divider} />
          <InfoRow label="End Time" value={formatDateTime(booking.endTime)} />
          <View style={styles.divider} />
          <InfoRow label="Duration" value={formatDuration(booking.duration)} />
          <View style={styles.divider} />
          <InfoRow label="Total" value={`$${booking.totalAmount.toFixed(2)}`} valueColor={colors.primary} />
        </View>

        {editMode && isActive && (
          <>
            <Text style={styles.sectionTitle}>Spot</Text>
            <TouchableOpacity
              style={[styles.card, shadows.sm, styles.spotPickerBtn]}
              onPress={() => setSpotModalVisible(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.spotPickerLabel}>
                {selectedSpotId ? `Spot #${selectedSpotId.slice(-6).toUpperCase()}` : 'Select a spot'}
              </Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

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

            <Text style={styles.sectionTitle}>Start Time</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.startScroll}>
              {startOptions.map(o => (
                <TouchableOpacity
                  key={o.iso}
                  style={[styles.startChip, selectedStartIso === o.iso && styles.startChipActive]}
                  onPress={() => setSelectedStartIso(o.iso)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.startChipText, selectedStartIso === o.iso && styles.startChipTextActive]}>
                    {o.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedSpotId && (
              <View style={[styles.summaryCard, shadows.sm]}>
                <Text style={styles.summaryLabel}>${hourlyRate.toFixed(2)}/h × {selectedDuration}h</Text>
                <Text style={styles.summaryTotal}>= ${(hourlyRate * selectedDuration).toFixed(2)}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit} disabled={saving} activeOpacity={0.85}>
              <LinearGradient colors={gradients.primaryHorizontal} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtnInner}>
                <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelEditBtn} onPress={() => setEditMode(false)} activeOpacity={0.85}>
              <Text style={styles.cancelEditText}>Discard Changes</Text>
            </TouchableOpacity>
          </>
        )}

        {!editMode && isActive && (
          <TouchableOpacity style={styles.editBtn} onPress={handleEnterEdit} activeOpacity={0.85}>
            <LinearGradient colors={gradients.primaryHorizontal} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.editBtnInner}>
              <Text style={styles.editBtnText}>Edit Booking</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {isActive && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.85}>
            <Text style={styles.cancelBtnText}>Cancel Booking</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.85}>
          <Text style={styles.deleteBtnText}>Delete Booking</Text>
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
        currentBookingSpotId={booking.spotId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { ...typography.body, color: colors.textMuted },

  header: { paddingTop: 24, paddingBottom: spacing.xl, alignItems: 'center', gap: spacing.sm },
  statusBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full },
  statusText: { fontSize: 13, fontWeight: '700' },
  spotLabel: { ...typography.h2, color: colors.textInverse },
  amountText: { fontSize: 36, fontWeight: '800', color: colors.textInverse },

  body: { flex: 1 },
  bodyContent: { padding: spacing.lg, paddingBottom: spacing.xxl },

  card: { backgroundColor: colors.surface, borderRadius: radius.lg, marginBottom: spacing.lg, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  infoLabel: { ...typography.body, color: colors.textSecondary },
  infoValue: { ...typography.bodySemiBold },
  divider: { height: 1, backgroundColor: colors.borderLight, marginHorizontal: spacing.md },

  sectionTitle: { ...typography.label, marginBottom: spacing.sm, marginTop: spacing.xs },

  spotPickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md },
  spotPickerLabel: { ...typography.bodySemiBold },
  chevron: { fontSize: 22, color: colors.primaryMuted },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  chipText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: colors.primary },

  startScroll: { marginBottom: spacing.md },
  startChip: {
    marginRight: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface,
  },
  startChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  startChipText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  startChipTextActive: { color: colors.primary },

  summaryCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md,
  },
  summaryLabel: { ...typography.body, color: colors.textSecondary },
  summaryTotal: { fontSize: 18, fontWeight: '800', color: colors.primary },

  saveBtn: { borderRadius: radius.md, overflow: 'hidden', marginBottom: spacing.sm },
  saveBtnInner: { padding: spacing.md, alignItems: 'center' },
  saveBtnText: { ...typography.button },

  cancelEditBtn: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
    padding: spacing.md, alignItems: 'center', marginBottom: spacing.lg,
  },
  cancelEditText: { ...typography.button, color: colors.textSecondary },

  editBtn: { borderRadius: radius.md, overflow: 'hidden', marginBottom: spacing.md },
  editBtnInner: { padding: spacing.md, alignItems: 'center' },
  editBtnText: { ...typography.button },

  cancelBtn: {
    borderWidth: 1.5, borderColor: colors.warning,
    borderRadius: radius.md, padding: spacing.md, alignItems: 'center', marginBottom: spacing.md,
  },
  cancelBtnText: { ...typography.button, color: colors.warning },

  deleteBtn: {
    borderWidth: 1.5, borderColor: colors.danger,
    borderRadius: radius.md, padding: spacing.md, alignItems: 'center',
  },
  deleteBtnText: { ...typography.button, color: colors.danger },
});
