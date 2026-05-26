import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as bookingsApi from '../../api/bookings';
import { BookingsStackParams } from '../../navigation/DriverTabs';
import { colors, gradients, radius, shadows, spacing, typography } from '../../theme';
import { BookingResponse } from '../../types';
import { formatDateTime, formatDuration } from '../../utils/bookingUtils';

type Props = NativeStackScreenProps<BookingsStackParams, 'BookingDetail'>;

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', color: colors.warning },
  CONFIRMED: { label: 'Confirmed', color: colors.success },
  CANCELLED: { label: 'Cancelled', color: colors.textMuted },
  EXPIRED: { label: 'Expired', color: colors.danger },
  EXTENDED: { label: 'Extended', color: colors.info },
};

const EXTEND_OPTIONS = [30, 60, 120, 180];

function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
    </View>
  );
}

export default function BookingDetailScreen({ navigation, route }: Props) {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    bookingsApi.getBooking(bookingId)
      .then(res => setBooking(res.data))
      .catch(() => Alert.alert('Error', 'Could not load booking'));
  }, [bookingId]);

  const isActive = booking && (booking.status === 'CONFIRMED' || booking.status === 'PENDING' || booking.status === 'EXTENDED');
  const canCheckIn = booking && (booking.status === 'CONFIRMED' || booking.status === 'EXTENDED') && booking.spotStatus === 'RESERVED';
  const checkedIn = booking?.spotStatus === 'OCCUPIED';

  const handleCheckIn = async () => {
    if (!booking) return;
    setLoading(true);
    try {
      const res = await bookingsApi.checkInBooking(bookingId);
      setBooking(res.data);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error ?? 'Could not check in');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel Booking', style: 'destructive', onPress: async () => {
          setLoading(true);
          try {
            await bookingsApi.cancelBooking(bookingId);
            setBooking(prev => prev ? { ...prev, status: 'CANCELLED' } : null);
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.error ?? 'Could not cancel');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleExtend = (minutes: number) => {
    Alert.alert('Extend Booking', `Add ${minutes} minutes?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Extend', onPress: async () => {
          setLoading(true);
          try {
            await bookingsApi.extendBooking(bookingId, { additionalMinutes: minutes });
            const updated = await bookingsApi.getBooking(bookingId);
            setBooking(updated.data);
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.error ?? 'Could not extend');
          } finally {
            setLoading(false);
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

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={[styles.statusBadge, { backgroundColor: status.color + '30' }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
        <Text style={styles.spotLabel}>{booking.floorLabel} · {booking.spotType === 'EV' ? 'EV' : booking.spotType === 'DISABLED' ? 'Accessible' : 'Standard'} Spot</Text>
        <Text style={styles.amountText}>${booking.totalAmount.toFixed(2)}</Text>
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={[styles.card, shadows.sm]}>
          <InfoRow label="Booking ID" value={`#${booking.bookingId.slice(-8).toUpperCase()}`} />
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

        {isActive && (
          <>
            {(canCheckIn || checkedIn) && (
              <TouchableOpacity
                style={[styles.checkInBtn, checkedIn && styles.checkInBtnDone]}
                onPress={canCheckIn ? handleCheckIn : undefined}
                disabled={!canCheckIn || loading}
                activeOpacity={0.85}
              >
                <Text style={[styles.checkInBtnText, checkedIn && styles.checkInBtnTextDone]}>
                  {checkedIn ? 'Checked In ✓' : loading ? 'Checking in…' : "I've Arrived"}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.manageBtn}
              onPress={() => navigation.navigate('EditBooking', { bookingId })}
              activeOpacity={0.85}
            >
              <LinearGradient colors={gradients.primaryHorizontal} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.manageBtnInner}>
                <Text style={styles.manageBtnText}>Manage Booking</Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Quick Extend</Text>
            <View style={styles.extendRow}>
              {EXTEND_OPTIONS.map(m => (
                <TouchableOpacity key={m} style={styles.extendChip} onPress={() => handleExtend(m)} disabled={loading} activeOpacity={0.8}>
                  <Text style={styles.extendChipText}>+{m < 60 ? `${m}m` : `${m / 60}h`}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} disabled={loading} activeOpacity={0.85}>
              <Text style={styles.cancelBtnText}>{loading ? 'Processing…' : 'Cancel Booking'}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
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

  sectionTitle: { ...typography.label, marginBottom: spacing.sm },
  extendRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  extendChip: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.primaryLight,
    alignItems: 'center',
  },
  extendChipText: { ...typography.caption, color: colors.primary, fontWeight: '700' },

  checkInBtn: {
    borderRadius: radius.md, padding: spacing.md, alignItems: 'center',
    backgroundColor: colors.success, marginBottom: spacing.md,
  },
  checkInBtnDone: { backgroundColor: colors.surfaceAlt },
  checkInBtnText: { ...typography.button, color: colors.textInverse },
  checkInBtnTextDone: { color: colors.textSecondary },

  manageBtn: { borderRadius: radius.md, overflow: 'hidden', marginBottom: spacing.md },
  manageBtnInner: { padding: spacing.md, alignItems: 'center' },
  manageBtnText: { ...typography.button },

  cancelBtn: {
    borderWidth: 1.5, borderColor: colors.danger,
    borderRadius: radius.md, padding: spacing.md, alignItems: 'center',
  },
  cancelBtnText: { ...typography.button, color: colors.danger },
});
