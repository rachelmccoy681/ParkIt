import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as bookingsApi from '../../api/bookings';
import { AdminStackParams } from '../../navigation/AdminStack';
import { colors, gradients, radius, shadows, spacing, typography } from '../../theme';
import { BookingResponse } from '../../types';

type Props = NativeStackScreenProps<AdminStackParams, 'BookingManagement'>;

const STATUS_CONFIG = {
  PENDING:   { label: 'Pending',   color: colors.warning,   bg: colors.warning + '20' },
  CONFIRMED: { label: 'Confirmed', color: colors.success,   bg: colors.success + '20' },
  CANCELLED: { label: 'Cancelled', color: colors.textMuted, bg: colors.surfaceAlt },
  EXPIRED:   { label: 'Expired',   color: colors.danger,    bg: colors.danger + '20' },
  EXTENDED:  { label: 'Extended',  color: colors.info,      bg: colors.info + '20' },
};

const ACTIVE_STATUSES = new Set(['PENDING', 'CONFIRMED', 'EXTENDED']);

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function BookingRow({ b, onPress }: { b: BookingResponse; onPress: () => void }) {
  const status = STATUS_CONFIG[b.status];
  return (
    <TouchableOpacity style={[styles.card, shadows.sm]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardTop}>
        <Text style={styles.spotLabel}>Spot #{b.spotId.slice(-6).toUpperCase()}</Text>
        <View style={[styles.badge, { backgroundColor: status.bg }]}>
          <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>
      <Text style={styles.userId}>User: {b.userId.slice(-8).toUpperCase()}</Text>
      <View style={styles.cardBottom}>
        <Text style={styles.timeText}>{formatDateTime(b.startTime)} → {formatDateTime(b.endTime)}</Text>
        <Text style={styles.amount}>${b.totalAmount.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function AdminBookingManagementScreen({ navigation }: Props) {
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'past'>('active');

  const load = useCallback(() => {
    setLoading(true);
    bookingsApi.getAllBookingsAdmin()
      .then(res => setBookings(res.data))
      .catch(() => Alert.alert('Error', 'Could not load bookings'))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(load);

  const active = useMemo(() => bookings.filter(b => ACTIVE_STATUSES.has(b.status)), [bookings]);
  const past   = useMemo(() => bookings.filter(b => !ACTIVE_STATUSES.has(b.status)), [bookings]);
  const displayed = tab === 'active' ? active : past;

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>All Bookings</Text>
            <Text style={styles.headerSub}>{bookings.length} total</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AdminCreateBooking')}
            activeOpacity={0.85}
          >
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'active' && styles.tabBtnActive]}
          onPress={() => setTab('active')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabLabel, tab === 'active' && styles.tabLabelActive]}>
            Active{active.length > 0 ? ` (${active.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'past' && styles.tabBtnActive]}
          onPress={() => setTab('past')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabLabel, tab === 'past' && styles.tabLabelActive]}>
            Past{past.length > 0 ? ` (${past.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayed}
        keyExtractor={b => b.bookingId}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No {tab} bookings</Text>
            </View>
          ) : null
        }
        renderItem={({ item: b }) => (
          <BookingRow
            b={b}
            onPress={() => navigation.navigate('AdminBookingDetail', { bookingId: b.bookingId })}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: { paddingTop: spacing.xl, paddingBottom: spacing.lg, paddingHorizontal: spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { ...typography.h2, color: colors.textInverse },
  headerSub: { ...typography.caption, color: 'rgba(255,255,255,0.7)', marginTop: spacing.xs },
  addBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  addBtnText: { ...typography.bodyMedium, color: colors.textInverse, fontWeight: '700' },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabBtn: {
    flex: 1, paddingVertical: spacing.md, alignItems: 'center',
    borderBottomWidth: 2.5, borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: colors.primary },
  tabLabel: { ...typography.bodyMedium, color: colors.textMuted },
  tabLabelActive: { color: colors.primary },

  list: { padding: spacing.lg, paddingBottom: spacing.xxl },

  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.md,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  spotLabel: { ...typography.bodySemiBold },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full },
  badgeText: { fontSize: 11, fontWeight: '700' },
  userId: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeText: { ...typography.caption, color: colors.textSecondary, flex: 1 },
  amount: { fontSize: 15, fontWeight: '800', color: colors.primary },

  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyText: { ...typography.body, color: colors.textMuted },
});
