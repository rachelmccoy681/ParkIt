import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as bookingsApi from '../../api/bookings';
import * as vehiclesApi from '../../api/vehicles';
import { useAuth } from '../../context/AuthContext';
import { MapStackParams } from '../../navigation/DriverTabs';
import { colors, gradients, radius, shadows, spacing, typography } from '../../theme';
import { VehicleResponse } from '../../types';

type Props = NativeStackScreenProps<MapStackParams, 'BookingForm'>;

const DURATION_OPTIONS = [1, 2, 3, 4, 6, 8, 12, 24];
const VEHICLE_ICONS: Record<string, string> = { GAS: '⛽', EV: '⚡', HYBRID: '🔋' };

export default function BookingFormScreen({ navigation, route }: Props) {
  const { spot } = route.params;
  const { userId } = useAuth();
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleResponse | null>(null);
  const [durationHours, setDurationHours] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    vehiclesApi.getMyVehicles().then(res => {
      setVehicles(res.data);
      if (res.data.length > 0) setSelectedVehicle(res.data[0]);
    }).catch(() => Alert.alert('Error', 'Could not load vehicles'));
  }, []);

  const totalAmount = durationHours * spot.hourlyRate;

  const handleBook = async () => {
    if (!selectedVehicle) {
      Alert.alert('Select a vehicle', 'Please select a vehicle to book with.');
      return;
    }
    setLoading(true);
    try {
      await bookingsApi.createBooking({
        spotId: spot.spotId,
        vehicleId: selectedVehicle.vehicleId,
        startTime: new Date().toISOString(),
        durationMinutes: durationHours * 60,
      });
      Alert.alert('Booking Confirmed!', `Your spot is booked for ${durationHours}h. Total: $${totalAmount.toFixed(2)}`, [
        { text: 'View Bookings', onPress: () => navigation.popToTop() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error ?? 'Could not create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <Text style={styles.headerTitle}>Book Spot</Text>
        <Text style={styles.headerSub}>Spot #{spot.spotId.slice(-6).toUpperCase()} · ${spot.hourlyRate}/hr</Text>
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>

        <Text style={styles.sectionTitle}>Select Vehicle</Text>
        {vehicles.length === 0 ? (
          <View style={[styles.card, styles.emptyCard]}>
            <Text style={styles.emptyText}>No vehicles found. Add one in your profile.</Text>
          </View>
        ) : (
          <View style={[styles.card, shadows.sm]}>
            {vehicles.map((v, i) => {
              const selected = selectedVehicle?.vehicleId === v.vehicleId;
              return (
                <View key={v.vehicleId}>
                  <TouchableOpacity
                    style={[styles.vehicleRow, selected && styles.vehicleRowSelected]}
                    onPress={() => setSelectedVehicle(v)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.vehicleIcon}>{VEHICLE_ICONS[v.vehicleType]}</Text>
                    <View style={styles.vehicleInfo}>
                      <Text style={styles.vehicleName}>{v.make} {v.model}</Text>
                      <Text style={styles.vehiclePlate}>{v.plateNumber}</Text>
                    </View>
                    {selected && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                  {i < vehicles.length - 1 && <View style={styles.divider} />}
                </View>
              );
            })}
          </View>
        )}

        <Text style={styles.sectionTitle}>Duration</Text>
        <View style={styles.durationGrid}>
          {DURATION_OPTIONS.map(h => (
            <TouchableOpacity
              key={h}
              style={[styles.durationChip, durationHours === h && styles.durationChipSelected]}
              onPress={() => setDurationHours(h)}
              activeOpacity={0.8}
            >
              <Text style={[styles.durationChipText, durationHours === h && styles.durationChipTextSelected]}>
                {h}h
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.summaryCard, shadows.md]}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Rate</Text>
            <Text style={styles.summaryValue}>${spot.hourlyRate.toFixed(2)} / hr</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duration</Text>
            <Text style={styles.summaryValue}>{durationHours} hour{durationHours !== 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.bookBtn} onPress={handleBook} disabled={loading || !selectedVehicle} activeOpacity={0.85}>
          <LinearGradient
            colors={selectedVehicle ? gradients.primaryHorizontal : ['#C4B5FD', '#C4B5FD']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.bookBtnInner}
          >
            <Text style={styles.bookBtnText}>{loading ? 'Booking…' : `Confirm Booking · $${totalAmount.toFixed(2)}`}</Text>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: { paddingTop: 24, paddingBottom: spacing.xl, alignItems: 'center' },
  headerTitle: { ...typography.h2, color: colors.textInverse },
  headerSub: { ...typography.caption, color: 'rgba(255,255,255,0.7)', marginTop: spacing.xs },

  body: { flex: 1 },
  bodyContent: { padding: spacing.lg, paddingBottom: spacing.xxl },

  sectionTitle: { ...typography.label, marginBottom: spacing.sm, marginTop: spacing.xs },

  card: { backgroundColor: colors.surface, borderRadius: radius.lg, marginBottom: spacing.lg, overflow: 'hidden' },
  emptyCard: { padding: spacing.lg, alignItems: 'center' },
  emptyText: { ...typography.caption, textAlign: 'center' },

  vehicleRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  vehicleRowSelected: { backgroundColor: colors.primaryLight },
  vehicleIcon: { fontSize: 24 },
  vehicleInfo: { flex: 1 },
  vehicleName: { ...typography.bodySemiBold },
  vehiclePlate: { ...typography.caption, marginTop: 2 },
  checkmark: { fontSize: 18, color: colors.primary, fontWeight: '700' },
  divider: { height: 1, backgroundColor: colors.borderLight, marginHorizontal: spacing.md },

  durationGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg,
  },
  durationChip: {
    width: 60, height: 44, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.surface,
  },
  durationChipSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  durationChipText: { ...typography.bodyMedium, color: colors.textSecondary },
  durationChipTextSelected: { color: colors.primary, fontWeight: '700' },

  summaryCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  summaryLabel: { ...typography.body, color: colors.textSecondary },
  summaryValue: { ...typography.bodyMedium },
  totalLabel: { ...typography.bodySemiBold, fontSize: 17 },
  totalValue: { fontSize: 20, fontWeight: '800', color: colors.primary },

  bookBtn: { borderRadius: radius.md, overflow: 'hidden' },
  bookBtnInner: { padding: spacing.md, alignItems: 'center' },
  bookBtnText: { ...typography.button },
});
