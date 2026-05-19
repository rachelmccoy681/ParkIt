import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  Alert, FlatList, Modal, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import * as bookingsApi from '../../api/bookings';
import * as lotsApi from '../../api/lots';
import * as vehiclesApi from '../../api/vehicles';
import { BookingsStackParams } from '../../navigation/DriverTabs';
import { colors, gradients, radius, shadows, spacing, typography } from '../../theme';
import {
  BookingResponse, ParkingFloorResponse, ParkingSpotResponse, VehicleResponse,
} from '../../types';

type Props = NativeStackScreenProps<BookingsStackParams, 'EditBooking'>;

const DURATION_OPTIONS = [1, 2, 3, 4, 6, 8, 12, 24];
const VEHICLE_ICONS: Record<string, string> = { GAS: '⛽', EV: '⚡', HYBRID: '🔋' };
const STATUS_COLORS = { AVAILABLE: colors.available, OCCUPIED: colors.occupied, RESERVED: colors.reserved };
const SPOT_TYPE_ICONS: Record<string, string> = { STANDARD: '', EV: '⚡', DISABLED: '♿' };

function buildStartOptions(): { label: string; iso: string }[] {
  const now = new Date();
  const opts: { label: string; iso: string }[] = [];
  for (let dayOffset = 0; dayOffset <= 2; dayOffset++) {
    for (const hour of [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]) {
      const d = new Date(now);
      d.setDate(d.getDate() + dayOffset);
      d.setHours(hour, 0, 0, 0);
      if (d <= now) continue;
      const dayLabel = dayOffset === 0 ? 'Today' : dayOffset === 1 ? 'Tomorrow' : 'In 2 days';
      opts.push({
        label: `${dayLabel} ${hour}:00`,
        iso: d.toISOString(),
      });
      if (opts.length >= 12) return opts;
    }
  }
  return opts;
}

export default function EditBookingScreen({ navigation, route }: Props) {
  const { bookingId } = route.params;

  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [durationHours, setDurationHours] = useState(1);
  const [startOptions] = useState(buildStartOptions);
  const [selectedStartIso, setSelectedStartIso] = useState('');
  const [selectedSpotId, setSelectedSpotId] = useState('');
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpotResponse | null>(null);

  // Spot picker modal state
  const [spotModalVisible, setSpotModalVisible] = useState(false);
  const [floors, setFloors] = useState<ParkingFloorResponse[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<ParkingFloorResponse | null>(null);
  const [floorSpots, setFloorSpots] = useState<ParkingSpotResponse[]>([]);

  const [saving, setSaving] = useState(false);

  // Validation errors
  const [spotError, setSpotError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    Promise.all([
      bookingsApi.getBooking(bookingId),
      vehiclesApi.getMyVehicles(),
    ]).then(([bRes, vRes]) => {
      const b = bRes.data;
      setBooking(b);
      setSelectedVehicleId(b.vehicleId);
      setDurationHours(Math.round(b.duration / 60) || 1);
      setSelectedStartIso(b.startTime);
      setSelectedSpotId(b.spotId);

      setVehicles(vRes.data);

      // Load the lot/floors for spot picker (load all lots then all floors)
      lotsApi.getLots().then(async lRes => {
        const allFloors: ParkingFloorResponse[] = [];
        for (const lot of lRes.data) {
          const fRes = await lotsApi.getFloors(lot.lotId);
          allFloors.push(...fRes.data);
        }
        setFloors(allFloors);
        if (allFloors.length > 0) setSelectedFloor(allFloors[0]);
      });
    }).catch(() => Alert.alert('Error', 'Could not load booking'));
  }, [bookingId]);

  useEffect(() => {
    if (!selectedFloor) return;
    lotsApi.getSpots(selectedFloor.floorId).then(res => setFloorSpots(res.data));
  }, [selectedFloor]);

  const isSpotValid = !selectedSpot || selectedSpot.status === 'AVAILABLE' || selectedSpotId === booking?.spotId;
  const canSubmit = selectedVehicleId && selectedStartIso && isSpotValid && !saving;

  const handleSave = async () => {
    setSubmitted(true);
    if (!selectedSpot && selectedSpotId !== booking?.spotId) {
      setSpotError('Please select an available spot');
      return;
    }
    if (!canSubmit) return;

    setSaving(true);
    try {
      await bookingsApi.editBooking(bookingId, {
        spotId: selectedSpotId,
        vehicleId: selectedVehicleId,
        startTime: selectedStartIso,
        durationMinutes: durationHours * 60,
      });
      Alert.alert('Booking Updated', 'Your booking has been modified.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error ?? 'Could not update booking');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectSpot = (spot: ParkingSpotResponse) => {
    if (spot.status !== 'AVAILABLE' && spot.spotId !== booking?.spotId) return;
    setSelectedSpotId(spot.spotId);
    setSelectedSpot(spot);
    setSpotError('');
    setSpotModalVisible(false);
  };

  if (!booking) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  const totalAmount = durationHours * (selectedSpot?.hourlyRate ?? 0);
  const showSpotError = submitted && !!spotError;

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <Text style={styles.headerTitle}>Edit Booking</Text>
        <Text style={styles.headerSub}>Booking #{bookingId.slice(-8).toUpperCase()}</Text>
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>

        {/* Spot */}
        <Text style={styles.sectionTitle}>Parking Spot</Text>
        <View style={[styles.card, shadows.sm, showSpotError && styles.cardError]}>
          <View style={styles.spotRow}>
            <View style={styles.spotInfo}>
              <Text style={styles.spotIdText}>
                Spot #{selectedSpotId.slice(-6).toUpperCase()}
                {selectedSpotId === booking.spotId ? ' (current)' : ' (changed)'}
              </Text>
              {selectedSpot && selectedSpot.spotId !== booking.spotId && (
                <Text style={[
                  styles.spotStatusText,
                  { color: STATUS_COLORS[selectedSpot.status] },
                ]}>
                  {selectedSpot.status}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.changeSpotBtn}
              onPress={() => setSpotModalVisible(true)}
            >
              <Text style={styles.changeSpotText}>Change</Text>
            </TouchableOpacity>
          </View>
          {showSpotError && <Text style={styles.errorText}>{spotError}</Text>}
        </View>

        {/* Vehicle */}
        <Text style={styles.sectionTitle}>Vehicle</Text>
        <View style={[styles.card, shadows.sm]}>
          {vehicles.map((v, i) => {
            const sel = v.vehicleId === selectedVehicleId;
            return (
              <View key={v.vehicleId}>
                <TouchableOpacity
                  style={[styles.vehicleRow, sel && styles.vehicleRowSelected]}
                  onPress={() => setSelectedVehicleId(v.vehicleId)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.vehicleIcon}>{VEHICLE_ICONS[v.vehicleType]}</Text>
                  <View style={styles.vehicleInfo}>
                    <Text style={styles.vehicleName}>{v.make} {v.model}</Text>
                    <Text style={styles.vehiclePlate}>{v.plateNumber}</Text>
                  </View>
                  {sel && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
                {i < vehicles.length - 1 && <View style={styles.divider} />}
              </View>
            );
          })}
        </View>

        {/* Duration */}
        <Text style={styles.sectionTitle}>Duration</Text>
        <View style={styles.chipRow}>
          {DURATION_OPTIONS.map(h => (
            <TouchableOpacity
              key={h}
              style={[styles.chip, durationHours === h && styles.chipSelected]}
              onPress={() => setDurationHours(h)}
            >
              <Text style={[styles.chipText, durationHours === h && styles.chipTextSelected]}>
                {h}h
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Start Time */}
        <Text style={styles.sectionTitle}>Start Time</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.startScroll} contentContainerStyle={styles.startScrollContent}>
          {startOptions.map(opt => (
            <TouchableOpacity
              key={opt.iso}
              style={[styles.startChip, selectedStartIso === opt.iso && styles.startChipSelected]}
              onPress={() => setSelectedStartIso(opt.iso)}
            >
              <Text style={[styles.startChipText, selectedStartIso === opt.iso && styles.startChipTextSelected]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Summary */}
        {selectedSpot && (
          <View style={[styles.summaryCard, shadows.sm]}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Rate</Text>
              <Text style={styles.summaryValue}>${selectedSpot.hourlyRate.toFixed(2)}/hr</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration</Text>
              <Text style={styles.summaryValue}>{durationHours}h</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>New Total</Text>
              <Text style={styles.totalValue}>${totalAmount.toFixed(2)}</Text>
            </View>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.saveBtn, !canSubmit && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!canSubmit}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={canSubmit ? gradients.primaryHorizontal : ['#C4B5FD', '#C4B5FD']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.saveBtnInner}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Confirm Edit'}</Text>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>

      {/* Spot Picker Modal */}
      <Modal visible={spotModalVisible} animationType="slide" onRequestClose={() => setSpotModalVisible(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select a Spot</Text>
            <TouchableOpacity onPress={() => setSpotModalVisible(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Floor pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.floorBar} contentContainerStyle={styles.floorBarContent}>
            {floors.map(f => (
              <TouchableOpacity
                key={f.floorId}
                style={[styles.floorPill, selectedFloor?.floorId === f.floorId && styles.floorPillSelected]}
                onPress={() => setSelectedFloor(f)}
              >
                <Text style={[styles.floorPillText, selectedFloor?.floorId === f.floorId && styles.floorPillTextSelected]}>
                  {f.floorLabel}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.modalLegend}>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.available }]} /><Text style={styles.legendText}>Available</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.occupied }]} /><Text style={styles.legendText}>Taken</Text></View>
          </View>

          <FlatList
            data={floorSpots}
            keyExtractor={s => s.spotId}
            numColumns={5}
            contentContainerStyle={styles.spotGrid}
            columnWrapperStyle={{ gap: spacing.sm }}
            renderItem={({ item: spot }) => {
              const isCurrentSpot = spot.spotId === booking.spotId;
              const isAvailable = spot.status === 'AVAILABLE' || isCurrentSpot;
              const color = isCurrentSpot ? colors.primary : STATUS_COLORS[spot.status];
              const isSelected = spot.spotId === selectedSpotId;
              return (
                <TouchableOpacity
                  style={[
                    styles.spotCell,
                    { borderColor: color, backgroundColor: color + '20' },
                    isSelected && styles.spotCellSelected,
                    !isAvailable && styles.spotCellDisabled,
                  ]}
                  onPress={() => handleSelectSpot(spot)}
                  disabled={!isAvailable}
                  activeOpacity={0.7}
                >
                  {SPOT_TYPE_ICONS[spot.spotType] ? (
                    <Text style={styles.spotTypeIcon}>{SPOT_TYPE_ICONS[spot.spotType]}</Text>
                  ) : (
                    <View style={[styles.spotDot, { backgroundColor: color }]} />
                  )}
                  {isSelected && <Text style={styles.spotCheckmark}>✓</Text>}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { ...typography.body, color: colors.textMuted },

  header: { paddingTop: 24, paddingBottom: spacing.xl, alignItems: 'center' },
  headerTitle: { ...typography.h2, color: colors.textInverse },
  headerSub: { ...typography.caption, color: 'rgba(255,255,255,0.7)', marginTop: spacing.xs },

  body: { flex: 1 },
  bodyContent: { padding: spacing.lg, paddingBottom: spacing.xxl },

  sectionTitle: { ...typography.label, marginBottom: spacing.sm, marginTop: spacing.xs },

  card: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.md },
  cardError: { borderWidth: 1.5, borderColor: colors.danger },
  errorText: { ...typography.caption, color: colors.danger, padding: spacing.md, paddingTop: 0 },

  spotRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  spotInfo: { flex: 1 },
  spotIdText: { ...typography.bodySemiBold },
  spotStatusText: { ...typography.caption, fontWeight: '600', marginTop: 2 },
  changeSpotBtn: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.md, backgroundColor: colors.primaryLight,
  },
  changeSpotText: { ...typography.caption, color: colors.primary, fontWeight: '700' },

  vehicleRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  vehicleRowSelected: { backgroundColor: colors.primaryLight },
  vehicleIcon: { fontSize: 24 },
  vehicleInfo: { flex: 1 },
  vehicleName: { ...typography.bodySemiBold },
  vehiclePlate: { ...typography.caption, marginTop: 2 },
  checkmark: { fontSize: 18, color: colors.primary, fontWeight: '700' },
  divider: { height: 1, backgroundColor: colors.borderLight, marginHorizontal: spacing.md },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    width: 60, height: 44, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface,
  },
  chipSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  chipText: { ...typography.bodyMedium, color: colors.textSecondary },
  chipTextSelected: { color: colors.primary, fontWeight: '700' },

  startScroll: { marginBottom: spacing.md },
  startScrollContent: { gap: spacing.sm },
  startChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  startChipSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  startChipText: { ...typography.caption, fontWeight: '600', color: colors.textSecondary },
  startChipTextSelected: { color: colors.primary },

  summaryCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  summaryLabel: { ...typography.body, color: colors.textSecondary },
  summaryValue: { ...typography.bodyMedium },
  totalLabel: { ...typography.bodySemiBold, fontSize: 17 },
  totalValue: { fontSize: 20, fontWeight: '800', color: colors.primary },

  saveBtn: { borderRadius: radius.md, overflow: 'hidden' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnInner: { padding: spacing.md, alignItems: 'center' },
  saveBtnText: { ...typography.button },

  // Modal
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.lg, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  modalTitle: { ...typography.h3 },
  modalClose: { fontSize: 20, color: colors.textMuted, padding: spacing.xs },

  floorBar: { maxHeight: 52, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  floorBarContent: { paddingHorizontal: spacing.md, gap: spacing.sm, alignItems: 'center' },
  floorPill: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
  },
  floorPillSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  floorPillText: { ...typography.caption, fontWeight: '700', color: colors.textSecondary },
  floorPillTextSelected: { color: colors.primary },

  modalLegend: { flexDirection: 'row', gap: spacing.lg, padding: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 10, height: 10, borderRadius: radius.full },
  legendText: { ...typography.caption, fontWeight: '600' },

  spotGrid: { padding: spacing.md },
  spotCell: {
    width: 52, height: 52, borderRadius: radius.sm,
    borderWidth: 1.5, margin: 4,
    justifyContent: 'center', alignItems: 'center',
  },
  spotCellSelected: { borderWidth: 2.5 },
  spotCellDisabled: { opacity: 0.35 },
  spotDot: { width: 14, height: 14, borderRadius: radius.full },
  spotTypeIcon: { fontSize: 16 },
  spotCheckmark: { position: 'absolute', fontSize: 10, fontWeight: '800', color: colors.primary, bottom: 2, right: 4 },
});
