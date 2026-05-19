import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as bookingsApi from '../../api/bookings';
import { useAuth } from '../../context/AuthContext';
import { BookingsStackParams } from '../../navigation/DriverTabs';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { BookingResponse } from '../../types';
import { formatDurationShort } from '../../utils/bookingUtils';

type Props = NativeStackScreenProps<BookingsStackParams, 'MyBookings'>;

const STATUS_CONFIG = {
  PENDING:   { label: 'Pending',   color: colors.warning,    bg: colors.warning + '20' },
  CONFIRMED: { label: 'Confirmed', color: colors.success,    bg: colors.success + '20' },
  CANCELLED: { label: 'Cancelled', color: colors.textMuted,  bg: colors.surfaceAlt },
  EXPIRED:   { label: 'Expired',   color: colors.danger,     bg: colors.danger + '20' },
  EXTENDED:  { label: 'Extended',  color: colors.info,       bg: colors.info + '20' },
};

const ACTIVE_STATUSES = new Set(['PENDING', 'CONFIRMED', 'EXTENDED']);

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function BookingCard({ b, onPress }: { b: BookingResponse; onPress: () => void }) {
  const status = STATUS_CONFIG[b.status];
  return (
    <TouchableOpacity style={[styles.card, shadows.sm]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <Text style={styles.spotLabel}>{b.floorLabel} · {b.spotType === 'EV' ? 'EV' : b.spotType === 'DISABLED' ? 'Accessible' : 'Standard'} Spot</Text>
        <View style={[styles.badge, { backgroundColor: status.bg }]}>
          <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      <View style={styles.timeRow}>
        <View style={styles.timeBlock}>
          <Text style={styles.timeLabel}>Start</Text>
          <Text style={styles.timeValue}>{formatTime(b.startTime)}</Text>
          <Text style={styles.dateValue}>{formatDate(b.startTime)}</Text>
        </View>
        <View style={styles.timeDivider}>
          <View style={styles.timeLine} />
          <Text style={styles.durationText}>{formatDurationShort(b.duration)}</Text>
          <View style={styles.timeLine} />
        </View>
        <View style={styles.timeBlock}>
          <Text style={styles.timeLabel}>End</Text>
          <Text style={styles.timeValue}>{formatTime(b.endTime)}</Text>
          <Text style={styles.dateValue}>{formatDate(b.endTime)}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.amount}>${b.totalAmount.toFixed(2)}</Text>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

function EmptyState({ tab }: { tab: 'active' | 'past' }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>{tab === 'active' ? '🅿️' : '📋'}</Text>
      <Text style={styles.emptyTitle}>
        {tab === 'active' ? 'No active bookings' : 'No past bookings'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {tab === 'active'
          ? 'Find a spot on the Map tab to get started'
          : 'Completed and cancelled bookings will appear here'}
      </Text>
    </View>
  );
}

export default function MyBookingsScreen({ navigation }: Props) {
  const { userId } = useAuth();
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'past'>('active');

  useFocusEffect(useCallback(() => {
    if (!userId) return;
    setLoading(true);
    bookingsApi.getAllBookings(userId)
      .then(res => setBookings(res.data))
      .finally(() => setLoading(false));
  }, [userId]));

  const active = useMemo(() => bookings.filter(b => ACTIVE_STATUSES.has(b.status)), [bookings]);
  const past   = useMemo(() => bookings.filter(b => !ACTIVE_STATUSES.has(b.status)), [bookings]);
  const displayed = tab === 'active' ? active : past;

  return (
    <View style={styles.container}>
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
          !loading ? <EmptyState tab={tab} /> : null
        }
        renderItem={({ item: b }) => (
          <BookingCard
            b={b}
            onPress={() => navigation.navigate('BookingDetail', { bookingId: b.bookingId })}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  spotLabel: { ...typography.bodySemiBold },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full },
  badgeText: { fontSize: 12, fontWeight: '700' },

  timeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  timeBlock: { flex: 1, alignItems: 'center' },
  timeLabel: { ...typography.label, marginBottom: spacing.xs },
  timeValue: { ...typography.bodySemiBold, fontSize: 17 },
  dateValue: { ...typography.caption, marginTop: 2 },
  timeDivider: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  timeLine: { flex: 1, height: 1, backgroundColor: colors.border },
  durationText: { ...typography.caption, fontWeight: '600', color: colors.primary },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: spacing.sm },
  amount: { fontSize: 18, fontWeight: '800', color: colors.primary },
  chevron: { fontSize: 22, color: colors.primaryMuted },

  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyIcon: { fontSize: 56, marginBottom: spacing.md },
  emptyTitle: { ...typography.h3, marginBottom: spacing.sm },
  emptySubtitle: { ...typography.caption, textAlign: 'center' },
});
