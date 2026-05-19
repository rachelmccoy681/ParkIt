import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import * as analyticsApi from '../../api/analytics';
import * as lotsApi from '../../api/lots';
import { AdminStackParams } from '../../navigation/AdminStack';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { ParkingFloorResponse, PeakHourPoint, UtilizationSummary } from '../../types';

type Props = NativeStackScreenProps<AdminStackParams, 'Analytics'>;

const FILTERS: { label: string; days: number }[] = [
  { label: 'Week', days: 7 },
  { label: 'Month', days: 30 },
  { label: 'Year', days: 365 },
];

const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu',
  FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun',
};

const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

function hourLabel(h: number) {
  if (h === 0) return '12a';
  if (h < 12) return `${h}a`;
  if (h === 12) return '12p';
  return `${h - 12}p`;
}

function rateColor(rate: number) {
  if (rate > 0.75) return colors.danger;
  if (rate > 0.45) return colors.warning;
  return colors.success;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={[styles.statCard, shadows.sm]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );
}

function PeakHoursChart({ data }: { data: PeakHourPoint[] }) {
  const max = Math.max(...data.map(d => d.avgOccupancyRate), 0.01);
  const CHART_H = 100;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.peakChartContent}>
      {data.map(d => {
        const barH = Math.round((d.avgOccupancyRate / max) * CHART_H);
        const color = rateColor(d.avgOccupancyRate);
        return (
          <View key={d.hour} style={styles.peakBarWrap}>
            <View style={[styles.peakBarTrack, { height: CHART_H }]}>
              <View style={[styles.peakBar, { height: barH, backgroundColor: color }]} />
            </View>
            <Text style={styles.peakBarLabel}>{hourLabel(d.hour)}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

function DayOfWeekChart({ data }: { data: UtilizationSummary['dayOfWeekBreakdown'] }) {
  const sorted = [...data].sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));
  const max = Math.max(...sorted.map(d => d.avgOccupancyRate), 0.01);
  return (
    <View style={styles.dowChart}>
      {sorted.map(d => {
        const pct = (d.avgOccupancyRate / max) * 100;
        const color = rateColor(d.avgOccupancyRate);
        return (
          <View key={d.day} style={styles.dowRow}>
            <Text style={styles.dowLabel}>{DAY_LABELS[d.day] ?? d.day}</Text>
            <View style={styles.dowBarTrack}>
              <View style={[styles.dowBar, { width: `${pct}%`, backgroundColor: color }]} />
            </View>
            <Text style={styles.dowPct}>{Math.round(d.avgOccupancyRate * 100)}%</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function AdminAnalyticsScreen({ }: Props) {
  const [floors, setFloors] = useState<ParkingFloorResponse[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<ParkingFloorResponse | null>(null);
  const [peakHours, setPeakHours] = useState<PeakHourPoint[]>([]);
  const [utilization, setUtilization] = useState<UtilizationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingFloors, setLoadingFloors] = useState(true);
  const [days, setDays] = useState(365);

  useEffect(() => {
    lotsApi.getLots().then(async res => {
      const all: ParkingFloorResponse[] = [];
      await Promise.all(res.data.map(async lot => {
        const fr = await lotsApi.getFloors(lot.lotId);
        all.push(...fr.data);
      }));
      setFloors(all);
      if (all.length > 0) setSelectedFloor(all[0]);
    }).finally(() => setLoadingFloors(false));
  }, []);

  useEffect(() => {
    if (!selectedFloor) return;
    setLoading(true);
    Promise.all([
      analyticsApi.getPeakHours(selectedFloor.floorId, days),
      analyticsApi.getUtilization(selectedFloor.floorId, days),
    ]).then(([peakRes, utilRes]) => {
      setPeakHours(peakRes.data);
      setUtilization(utilRes.data);
    }).finally(() => setLoading(false));
  }, [selectedFloor, days]);

  const peakHourLabel = utilization
    ? hourLabel(utilization.peakHour) + (utilization.peakHour < 12 ? 'm' : 'm')
    : '—';

  const formattedPeakHour = utilization
    ? (utilization.peakHour === 0 ? '12:00 AM'
      : utilization.peakHour < 12 ? `${utilization.peakHour}:00 AM`
      : utilization.peakHour === 12 ? '12:00 PM'
      : `${utilization.peakHour - 12}:00 PM`)
    : '—';

  const formattedPeakDay = utilization
    ? (DAY_LABELS[utilization.peakDayOfWeek] ?? utilization.peakDayOfWeek)
    : '—';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {loadingFloors ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.floorBar} contentContainerStyle={styles.floorBarContent}>
            {floors.map(f => (
              <TouchableOpacity
                key={f.floorId}
                style={[styles.floorPill, selectedFloor?.floorId === f.floorId && styles.floorPillSelected]}
                onPress={() => setSelectedFloor(f)}
                activeOpacity={0.8}
              >
                <Text style={[styles.floorPillText, selectedFloor?.floorId === f.floorId && styles.floorPillTextSelected]}>
                  {f.floorLabel}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.filterBar}>
            {FILTERS.map(f => (
              <TouchableOpacity
                key={f.days}
                style={[styles.filterPill, days === f.days && styles.filterPillSelected]}
                onPress={() => setDays(f.days)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterPillText, days === f.days && styles.filterPillTextSelected]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loadingText}>Loading analytics…</Text>
            </View>
          ) : utilization && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Utilisation Summary</Text>
                <View style={styles.statsRow}>
                  <StatCard
                    label="Avg Utilisation"
                    value={`${Math.round(utilization.avgUtilizationRate * 100)}%`}
                  />
                  <StatCard label="Peak Hour" value={formattedPeakHour} />
                  <StatCard label="Busiest Day" value={formattedPeakDay} />
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Hourly Occupancy</Text>
                <Text style={styles.sectionSub}>
                  {FILTERS.find(f => f.days === days)?.label === 'Week'
                    ? 'Average over the past week'
                    : FILTERS.find(f => f.days === days)?.label === 'Month'
                    ? 'Average over the past month'
                    : 'Average over the past year'}
                </Text>
                <View style={[styles.chartCard, shadows.sm]}>
                  <PeakHoursChart data={peakHours} />
                  <View style={styles.legendRow}>
                    {[{ label: 'Low', color: colors.success }, { label: 'Medium', color: colors.warning }, { label: 'High', color: colors.danger }].map(l => (
                      <View key={l.label} style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                        <Text style={styles.legendLabel}>{l.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Day of Week Breakdown</Text>
                <Text style={styles.sectionSub}>
                  {FILTERS.find(f => f.days === days)?.label === 'Week'
                    ? 'Average over the past week'
                    : FILTERS.find(f => f.days === days)?.label === 'Month'
                    ? 'Average over the past month'
                    : 'Average over the past year'}
                </Text>
                <View style={[styles.chartCard, shadows.sm]}>
                  <DayOfWeekChart data={utilization.dayOfWeekBreakdown} />
                </View>
              </View>
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl },

  floorBar: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  floorBarContent: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  floorPill: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.border,
  },
  floorPillSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  floorPillText: { ...typography.caption, fontWeight: '600', color: colors.textSecondary },
  floorPillTextSelected: { color: colors.textInverse },

  filterBar: {
    flexDirection: 'row', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  filterPill: {
    flex: 1, paddingVertical: spacing.xs, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border, alignItems: 'center',
  },
  filterPillSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterPillText: { ...typography.caption, fontWeight: '700', color: colors.textSecondary },
  filterPillTextSelected: { color: colors.textInverse },

  loadingWrap: { alignItems: 'center', paddingTop: spacing.xxl, gap: spacing.sm },
  loadingText: { ...typography.caption, color: colors.textMuted },

  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  sectionTitle: { ...typography.label, marginBottom: spacing.xs },
  sectionSub: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm },

  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, alignItems: 'center', gap: spacing.xs,
  },
  statLabel: { ...typography.caption, textAlign: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.primary, textAlign: 'center' },
  statSub: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },

  chartCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md },

  peakChartContent: { paddingVertical: spacing.xs, gap: 4 },
  peakBarWrap: { alignItems: 'center', width: 28 },
  peakBarTrack: { justifyContent: 'flex-end', width: 18 },
  peakBar: { width: '100%', borderRadius: 3, minHeight: 2 },
  peakBarLabel: { fontSize: 9, color: colors.textMuted, marginTop: 4 },

  legendRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 8, height: 8, borderRadius: radius.full },
  legendLabel: { fontSize: 11, color: colors.textSecondary },

  dowChart: { gap: spacing.sm },
  dowRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dowLabel: { width: 32, ...typography.caption, fontWeight: '600' },
  dowBarTrack: { flex: 1, height: 12, backgroundColor: colors.borderLight, borderRadius: radius.full, overflow: 'hidden' },
  dowBar: { height: '100%', borderRadius: radius.full },
  dowPct: { width: 36, fontSize: 12, fontWeight: '600', color: colors.textSecondary, textAlign: 'right' },
});
