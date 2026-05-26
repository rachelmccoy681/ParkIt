import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import * as bookingsApi from '../../api/bookings';
import * as lotsApi from '../../api/lots';
import * as recommendationsApi from '../../api/recommendations';
import * as vehiclesApi from '../../api/vehicles';
import { useAuth } from '../../context/AuthContext';
import { useSpotUpdates } from '../../hooks/useSpotUpdates';
import { colors, gradients, radius, shadows, spacing, typography } from '../../theme';
import { BookingResponse, ParkingSpotResponse, RecommendationResponse } from '../../types';
import { formatDuration } from '../../utils/bookingUtils';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function StatCard({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <View style={[styles.statCard, shadows.sm]}>
      <Text style={[styles.statCount, { color }]}>{count}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={[styles.statBar, { backgroundColor: color + '30' }]}>
        <View style={[styles.statBarFill, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

function ActiveBookingCard({ booking, onPress }: { booking: BookingResponse; onPress: () => void }) {
  const spotTypeLabel = booking.spotType === 'EV' ? 'EV' : booking.spotType === 'DISABLED' ? 'Accessible' : 'Standard';
  return (
    <TouchableOpacity style={[styles.bookingCard, shadows.sm]} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.bookingCardHeader}>
        <View>
          <Text style={styles.bookingLocation}>{booking.floorLabel} · {spotTypeLabel} Spot</Text>
          <Text style={styles.bookingTimes}>
            {formatTime(booking.startTime)} → {formatTime(booking.endTime)}
          </Text>
        </View>
        <View style={[styles.activeBadge, { backgroundColor: booking.status === 'EXTENDED' ? colors.info + '20' : colors.success + '20' }]}>
          <Text style={[styles.activeBadgeText, { color: booking.status === 'EXTENDED' ? colors.info : colors.success }]}>
            {booking.status === 'EXTENDED' ? 'Extended' : 'Active'}
          </Text>
        </View>
      </View>
      <View style={styles.bookingCardFooter}>
        <Text style={styles.bookingDuration}>{formatDuration(booking.duration)}</Text>
        <Text style={styles.bookingAmount}>${booking.totalAmount.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function DriverDashboardScreen() {
  const { email } = useAuth();
  const navigation = useNavigation<any>();

  const [spots, setSpots] = useState<ParkingSpotResponse[]>([]);
  const [activeBookings, setActiveBookings] = useState<BookingResponse[]>([]);
  const [loadingSpots, setLoadingSpots] = useState(true);
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const [recommendedSpot, setRecommendedSpot] = useState<ParkingSpotResponse | null>(null);
  const [loadingRec, setLoadingRec] = useState(false);
  const { userId } = useAuth();

  useEffect(() => {
    let cancelled = false;
    async function loadSpots() {
      try {
        const lotsRes = await lotsApi.getLots();
        const all: ParkingSpotResponse[] = [];
        await Promise.all(
          lotsRes.data.map(async lot => {
            const floorsRes = await lotsApi.getFloors(lot.lotId);
            await Promise.all(
              floorsRes.data.map(async floor => {
                const spotsRes = await lotsApi.getSpots(floor.floorId);
                all.push(...spotsRes.data);
              })
            );
          })
        );
        if (!cancelled) setSpots(all);
      } finally {
        if (!cancelled) setLoadingSpots(false);
      }
    }
    loadSpots();
    return () => { cancelled = true; };
  }, []);

  // Auto-fetch recommendation + spot details for the user's first vehicle
  useEffect(() => {
    vehiclesApi.getMyVehicles().then(async res => {
      if (res.data.length === 0) return;
      try {
        const recRes = await recommendationsApi.getRecommendation(res.data[0].vehicleId);
        setRecommendation(recRes.data);
        const spotRes = await lotsApi.getSpot(recRes.data.suggestedSpotId);
        setRecommendedSpot(spotRes.data);
      } catch {}
    }).catch(() => {});
  }, []);

  useFocusEffect(useCallback(() => {
    if (!userId) return;
    bookingsApi.getActiveBookings(userId)
      .then(res => setActiveBookings(
        res.data
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
          .slice(0, 2)
      ))
      .catch(() => {});
  }, [userId]));

  useSpotUpdates(msg => {
    setSpots(prev => prev.map(s => s.spotId === msg.spotId ? { ...s, status: msg.status } : s));
  });

  const available = spots.filter(s => s.status === 'AVAILABLE').length;
  const reserved  = spots.filter(s => s.status === 'RESERVED').length;
  const occupied  = spots.filter(s => s.status === 'OCCUPIED').length;
  const displayName = email?.split('@')[0] ?? 'there';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <Text style={styles.greetingText}>{greeting()}</Text>
        <Text style={styles.nameText}>{displayName}</Text>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Parking Status</Text>
        {loadingSpots ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Loading…</Text>
          </View>
        ) : (
          <View style={styles.statsRow}>
            <StatCard count={available} label="Available" color={colors.available} />
            <StatCard count={reserved}  label="Reserved"  color={colors.reserved} />
            <StatCard count={occupied}  label="Occupied"  color={colors.occupied} />
          </View>
        )}
      </View>

      {activeBookings.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Active Booking{activeBookings.length > 1 ? 's' : ''}</Text>
          {activeBookings.map(b => (
            <ActiveBookingCard
              key={b.bookingId}
              booking={b}
              onPress={() => navigation.navigate('Bookings', { screen: 'BookingDetail', params: { bookingId: b.bookingId } })}
            />
          ))}
        </View>
      )}

      {recommendation && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended For You</Text>
          <View style={[styles.recCard, shadows.sm]}>
            <View style={styles.recHeader}>
              <Text style={styles.recIcon}>✨</Text>
              <View style={styles.recHeaderText}>
                {recommendedSpot ? (
                  <>
                    <Text style={styles.recTitle}>
                      Floor {recommendedSpot.floorLabel} · Spot #{recommendedSpot.spotId.slice(-6).toUpperCase()}
                      {' · '}
                      {recommendedSpot.spotType === 'EV' ? 'EV Charging' : recommendedSpot.spotType === 'DISABLED' ? 'Accessible' : 'Standard'}
                    </Text>
                    <Text style={styles.recFloor}>${recommendedSpot.hourlyRate.toFixed(2)} / hr</Text>
                  </>
                ) : (
                  <ActivityIndicator size="small" color={colors.primary} />
                )}
              </View>
            </View>
            <View style={styles.recReasonBox}>
              <Text style={styles.recReason}>{recommendation.reason}</Text>
            </View>
            {recommendedSpot ? (
              <TouchableOpacity
                style={styles.recBtn}
                onPress={() => navigation.navigate('Map', { screen: 'BookingForm', params: { spot: recommendedSpot } })}
                activeOpacity={0.85}
              >
                <LinearGradient colors={gradients.primaryHorizontal} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.recBtnInner}>
                  <Text style={styles.recBtnText}>Book This Spot</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={[styles.recBtn, { opacity: 0.4 }]}>
                <View style={[styles.recBtnInner, { backgroundColor: colors.primaryMuted }]}>
                  <Text style={styles.recBtnText}>Loading spot…</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity
          style={styles.primaryAction}
          onPress={() => navigation.navigate('Map')}
          activeOpacity={0.85}
        >
          <LinearGradient colors={gradients.primaryHorizontal} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryActionInner}>
            <Text style={styles.primaryActionIcon}>📍</Text>
            <Text style={styles.primaryActionText}>View Map</Text>
          </LinearGradient>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl },

  header: {
    paddingTop: 56, paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg, alignItems: 'center', gap: spacing.xs,
  },
  greetingText: { fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  nameText: { fontSize: 26, fontWeight: '800', color: colors.textInverse, textTransform: 'capitalize' },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    marginTop: spacing.sm, backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  liveDot: { width: 7, height: 7, borderRadius: radius.full, backgroundColor: colors.success },
  liveText: { fontSize: 11, fontWeight: '700', color: colors.textInverse, letterSpacing: 1.5 },

  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  sectionTitle: { ...typography.label, marginBottom: spacing.sm },

  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  loadingText: { ...typography.caption, color: colors.textMuted },

  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: {
    flex: 1, backgroundColor: colors.surface,
    borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', gap: spacing.xs,
  },
  statCount: { fontSize: 30, fontWeight: '800' },
  statLabel: { ...typography.caption, textAlign: 'center' },
  statBar: { width: '100%', height: 3, borderRadius: radius.full, marginTop: spacing.xs },
  statBarFill: { width: '60%', height: '100%', borderRadius: radius.full },

  bookingCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  bookingCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  bookingLocation: { ...typography.bodySemiBold },
  bookingTimes: { ...typography.caption, marginTop: 2 },
  activeBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full },
  activeBadgeText: { fontSize: 12, fontWeight: '700' },
  bookingCardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: spacing.sm,
  },
  bookingDuration: { ...typography.caption, fontWeight: '600' },
  bookingAmount: { fontSize: 16, fontWeight: '800', color: colors.primary },

  recCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    overflow: 'hidden', marginBottom: spacing.sm,
  },
  recHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.md,
  },
  recIcon: { fontSize: 28 },
  recHeaderText: { flex: 1 },
  recTitle: { ...typography.bodySemiBold, fontSize: 18, color: colors.primary },
  recFloor: { ...typography.caption, marginTop: 2 },
  recReasonBox: {
    marginHorizontal: spacing.md, marginBottom: spacing.md,
    backgroundColor: colors.primaryLight, borderRadius: radius.sm,
    padding: spacing.sm, borderLeftWidth: 3, borderLeftColor: colors.primary,
  },
  recReason: { ...typography.caption, color: colors.primaryDark },
  recBtn: { margin: spacing.md, marginTop: 0, borderRadius: radius.sm, overflow: 'hidden' },
  recBtnInner: { padding: spacing.sm, alignItems: 'center' },
  recBtnText: { ...typography.button },

  primaryAction: { borderRadius: radius.md, overflow: 'hidden', marginBottom: spacing.sm },
  primaryActionInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, padding: spacing.md,
  },
  primaryActionIcon: { fontSize: 18 },
  primaryActionText: { ...typography.button },

  secondaryAction: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, padding: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.md,
  },
  secondaryActionIcon: { fontSize: 18 },
  secondaryActionText: { ...typography.bodyMedium, color: colors.primary, fontWeight: '600' },
});
