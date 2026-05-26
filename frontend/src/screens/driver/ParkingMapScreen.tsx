import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Modal, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import * as lotsApi from '../../api/lots';
import { useSpotUpdates } from '../../hooks/useSpotUpdates';
import { MapStackParams } from '../../navigation/DriverTabs';
import { colors, gradients, radius, shadows, spacing, typography } from '../../theme';
import { ParkingFloorResponse, ParkingLotResponse, ParkingSpotResponse } from '../../types';

type Props = NativeStackScreenProps<MapStackParams, 'ParkingMap'>;

const STATUS_COLORS = {
  AVAILABLE: colors.available,
  OCCUPIED: colors.occupied,
  RESERVED: colors.reserved,
};

const SPOT_TYPE_ICONS: Record<string, string> = { STANDARD: '', EV: '⚡', DISABLED: '♿' };
const SEARCH_DURATIONS = [1, 2, 4, 8];

function buildDateOptions(): { label: string; date: Date }[] {
  const options: { label: string; date: Date }[] = [];
  const today = new Date();
  for (let i = 0; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    d.setHours(0, 0, 0, 0);
    let label: string;
    if (i === 0) label = 'Today';
    else if (i === 1) label = 'Tomorrow';
    else label = d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
    options.push({ label, date: d });
  }
  return options;
}

function formatHour(h: number): string {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

function SpotCell({ spot, searchMode, bookable, onPress }: {
  spot: ParkingSpotResponse;
  searchMode: boolean;
  bookable: boolean;
  onPress: () => void;
}) {
  const color = searchMode
    ? (bookable ? colors.available : colors.border)
    : STATUS_COLORS[spot.status];
  const tappable = searchMode ? bookable : spot.status === 'AVAILABLE';

  return (
    <TouchableOpacity
      style={[styles.spotCell, { backgroundColor: color + '20', borderColor: color }]}
      onPress={onPress}
      disabled={!tappable}
      activeOpacity={0.7}
    >
      {SPOT_TYPE_ICONS[spot.spotType] ? (
        <Text style={[styles.spotTypeIcon, !tappable && { opacity: 0.35 }]}>
          {SPOT_TYPE_ICONS[spot.spotType]}
        </Text>
      ) : (
        <View style={[styles.spotDot, { backgroundColor: color }]} />
      )}
    </TouchableOpacity>
  );
}

export default function ParkingMapScreen({ navigation }: Props) {
  const [lots, setLots] = useState<ParkingLotResponse[]>([]);
  const [selectedLot, setSelectedLot] = useState<ParkingLotResponse | null>(null);
  const [floors, setFloors] = useState<ParkingFloorResponse[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<ParkingFloorResponse | null>(null);
  const [spots, setSpots] = useState<ParkingSpotResponse[]>([]);
  const [loadingLots, setLoadingLots] = useState(true);
  const [loadingSpots, setLoadingSpots] = useState(false);

  // Time-search state
  const dateOptions = useMemo(() => buildDateOptions(), []);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [searchDateIdx, setSearchDateIdx] = useState(0);
  const [searchHour, setSearchHour] = useState(() => {
    const h = new Date().getHours() + 1;
    return h > 23 ? 0 : h;
  });
  const [searchDuration, setSearchDuration] = useState(1);
  const [searchMode, setSearchMode] = useState(false);
  const [bookableSpotIds, setBookableSpotIds] = useState<Set<string>>(new Set());
  const [bookableCount, setBookableCount] = useState(0);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const currentHour = new Date().getHours();
  const isToday = searchDateIdx === 0;

  const searchStartTime = useMemo(() => {
    const d = new Date(dateOptions[searchDateIdx].date);
    d.setHours(searchHour, 0, 0, 0);
    return d;
  }, [dateOptions, searchDateIdx, searchHour]);

  // Clamp hour when switching to today
  useEffect(() => {
    if (isToday && searchHour <= currentHour) {
      setSearchHour(currentHour + 1 > 23 ? 0 : currentHour + 1);
    }
  }, [searchDateIdx]);

  // WebSocket updates only apply in live mode
  useSpotUpdates((msg) => {
    if (!searchMode) {
      setSpots(prev => prev.map(s =>
        s.spotId === msg.spotId ? { ...s, status: msg.status } : s
      ));
    }
  });

  // Update floor occupancy rate from live spot state
  useEffect(() => {
    if (!selectedFloor || spots.length === 0) return;
    const nonAvailable = spots.filter(s => s.status !== 'AVAILABLE').length;
    const liveRate = nonAvailable / selectedFloor.capacity;
    setFloors(prev => prev.map(f =>
      f.floorId === selectedFloor.floorId ? { ...f, occupancyRate: liveRate } : f
    ));
  }, [spots]);

  useEffect(() => {
    lotsApi.getLots().then(res => {
      setLots(res.data);
      if (res.data.length > 0) setSelectedLot(res.data[0]);
    }).finally(() => setLoadingLots(false));
  }, []);

  useEffect(() => {
    if (!selectedLot) return;
    setFloors([]);
    setSelectedFloor(null);
    setSpots([]);
    setSearchMode(false);
    setBookableSpotIds(new Set());
    lotsApi.getFloors(selectedLot.lotId).then(res => {
      setFloors(res.data);
      if (res.data.length > 0) setSelectedFloor(res.data[0]);
    });
  }, [selectedLot]);

  useEffect(() => {
    if (!selectedFloor) return;
    setLoadingSpots(true);
    setSpots([]);
    setSearchMode(false);
    setBookableSpotIds(new Set());
    lotsApi.getSpots(selectedFloor.floorId).then(res => {
      setSpots(res.data);
    }).finally(() => setLoadingSpots(false));
  }, [selectedFloor]);

  // Silent refresh on focus (live mode only)
  useFocusEffect(
    useCallback(() => {
      if (!selectedFloor || searchMode) return;
      lotsApi.getSpots(selectedFloor.floorId).then(res => {
        setSpots(res.data);
      }).catch(() => {});
    }, [selectedFloor, searchMode])
  );

  const runSearch = useCallback(async (floorId: string, start: Date, durationHours: number) => {
    setLoadingSearch(true);
    const endTime = new Date(start);
    endTime.setHours(endTime.getHours() + durationHours);
    try {
      const [bookableRes, allRes] = await Promise.all([
        lotsApi.getBookableSpots(floorId, start.toISOString(), endTime.toISOString()),
        lotsApi.getSpots(floorId),
      ]);
      const ids = new Set(bookableRes.data.map(s => s.spotId));
      setBookableSpotIds(ids);
      setBookableCount(ids.size);
      setSpots(allRes.data);
      setSearchMode(true);
    } catch {
      Alert.alert('Error', 'Could not load availability for that time');
    } finally {
      setLoadingSearch(false);
      setLoadingSpots(false);
    }
  }, []);

  const handleSearch = () => {
    if (!selectedFloor) return;
    if (isToday && searchHour <= currentHour) {
      Alert.alert('Invalid time', 'Please select a future time slot.');
      return;
    }
    setPickerOpen(false);
    runSearch(selectedFloor.floorId, searchStartTime, searchDuration);
  };

  const clearSearch = () => {
    setSearchMode(false);
    setBookableSpotIds(new Set());
    setBookableCount(0);
    if (selectedFloor) {
      setLoadingSpots(true);
      lotsApi.getSpots(selectedFloor.floorId).then(res => setSpots(res.data))
        .finally(() => setLoadingSpots(false));
    }
  };

  const handleSpotPress = (spot: ParkingSpotResponse) => {
    navigation.navigate('SpotDetail', {
      spot,
      floorLabel: selectedFloor?.floorLabel ?? '',
      ...(searchMode && {
        startTime: searchStartTime.toISOString(),
        durationMinutes: searchDuration * 60,
      }),
    });
  };

  const availableCount = searchMode ? bookableCount : spots.filter(s => s.status === 'AVAILABLE').length;

  if (loadingLots) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading lots…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <Text style={styles.headerTitle}>{selectedLot?.name ?? 'Select a Lot'}</Text>
        {selectedLot && <Text style={styles.headerSub}>{selectedLot.address}</Text>}
        {selectedFloor && (
          <View style={styles.availBadge}>
            <Text style={styles.availText}>
              {searchMode ? `${availableCount} bookable` : `${availableCount} available`}
            </Text>
          </View>
        )}
      </LinearGradient>

      {lots.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.lotBar} contentContainerStyle={styles.lotBarContent}>
          {lots.map(lot => (
            <TouchableOpacity
              key={lot.lotId}
              style={[styles.lotPill, selectedLot?.lotId === lot.lotId && styles.lotPillSelected]}
              onPress={() => setSelectedLot(lot)}
              activeOpacity={0.8}
            >
              <Text style={[styles.lotPillText, selectedLot?.lotId === lot.lotId && styles.lotPillTextSelected]}>
                {lot.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {floors.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.floorBar} contentContainerStyle={styles.floorBarContent}>
          {floors.map(floor => (
            <TouchableOpacity
              key={floor.floorId}
              style={[styles.floorPill, selectedFloor?.floorId === floor.floorId && styles.floorPillSelected]}
              onPress={() => setSelectedFloor(floor)}
              activeOpacity={0.8}
            >
              <Text style={[styles.floorPillText, selectedFloor?.floorId === floor.floorId && styles.floorPillTextSelected]}>
                {floor.floorLabel}
              </Text>
              <Text style={[styles.floorOccupancy, selectedFloor?.floorId === floor.floorId && { color: colors.primary }]}>
                {Math.round((1 - floor.occupancyRate) * 100)}% free
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Time search section */}
      <View style={[styles.searchSection, shadows.sm]}>
        {searchMode ? (
          <View style={styles.searchBanner}>
            <View style={styles.searchBannerLeft}>
              <Text style={styles.searchBannerIcon}>🔍</Text>
              <View>
                <Text style={styles.searchBannerLabel}>
                  {dateOptions[searchDateIdx].label} · {formatHour(searchHour)} · {searchDuration}h
                </Text>
                <Text style={styles.searchBannerSub}>{bookableCount} spots bookable</Text>
              </View>
            </View>
            <TouchableOpacity onPress={clearSearch} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>× Live</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.searchPrompt} onPress={() => setPickerOpen(true)} activeOpacity={0.8}>
            <Text style={styles.searchPromptIcon}>📅</Text>
            <Text style={styles.searchPromptText}>Search by date & time</Text>
            <Text style={styles.searchPromptChevron}>›</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Time picker modal */}
      <Modal
        visible={pickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerOpen(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setPickerOpen(false)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />

          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Find Available Spots</Text>
            <TouchableOpacity onPress={() => setPickerOpen(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.pickerClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.pickerLabel}>Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipRow}>
            {dateOptions.map((opt, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.chip, searchDateIdx === i && styles.chipSelected]}
                onPress={() => setSearchDateIdx(i)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, searchDateIdx === i && styles.chipTextSelected]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.pickerLabel}>Time</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipRow}>
            {Array.from({ length: 24 }, (_, h) => h).map(h => {
              const disabled = isToday && h <= currentHour;
              const selected = searchHour === h && !disabled;
              return (
                <TouchableOpacity
                  key={h}
                  style={[styles.chip, selected && styles.chipSelected, disabled && styles.chipDisabled]}
                  onPress={() => !disabled && setSearchHour(h)}
                  activeOpacity={disabled ? 1 : 0.8}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected, disabled && styles.chipTextDisabled]}>
                    {formatHour(h)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={styles.pickerLabel}>Duration</Text>
          <View style={styles.durationRow}>
            {SEARCH_DURATIONS.map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.durationChip, searchDuration === d && styles.durationChipSelected]}
                onPress={() => setSearchDuration(d)}
                activeOpacity={0.8}
              >
                <Text style={[styles.durationChipText, searchDuration === d && styles.durationChipTextSelected]}>
                  {d}h
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.searchBtn}
            onPress={handleSearch}
            disabled={loadingSearch}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#7C3AED', '#5B21B6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.searchBtnInner}>
              <Text style={styles.searchBtnText}>{loadingSearch ? 'Checking…' : 'Search Available Spots'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {selectedFloor && (
            <TouchableOpacity
              style={styles.forecastBtn}
              onPress={() => {
                setPickerOpen(false);
                navigation.navigate('Prediction', { floorId: selectedFloor.floorId, floorLabel: selectedFloor.floorLabel });
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.forecastBtnText}>📊  View Availability Forecast for {selectedFloor.floorLabel}</Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>

      {/* Legend */}
      <View style={styles.legend}>
        {searchMode ? (
          <>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.available }]} />
              <Text style={styles.legendLabel}>Bookable</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.border }]} />
              <Text style={styles.legendLabel}>Taken</Text>
            </View>
          </>
        ) : (
          [
            { status: 'AVAILABLE', label: 'Available' },
            { status: 'OCCUPIED', label: 'Occupied' },
            { status: 'RESERVED', label: 'Reserved' },
          ].map(({ status, label }) => (
            <View key={status} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS[status as keyof typeof STATUS_COLORS] }]} />
              <Text style={styles.legendLabel}>{label}</Text>
            </View>
          ))
        )}
      </View>

      {loadingSpots || loadingSearch ? (
        <View style={styles.spotLoading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>{loadingSearch ? 'Checking availability…' : 'Loading spots…'}</Text>
        </View>
      ) : spots.length === 0 && selectedFloor ? (
        <View style={styles.spotLoading}>
          <Text style={styles.emptyText}>No spots on this floor</Text>
        </View>
      ) : (
        <FlatList
          data={spots}
          keyExtractor={s => s.spotId}
          numColumns={5}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item: spot }) => (
            <SpotCell
              spot={spot}
              searchMode={searchMode}
              bookable={bookableSpotIds.has(spot.spotId)}
              onPress={() => handleSpotPress(spot)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  loadingText: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },

  header: { paddingTop: 24, paddingBottom: spacing.lg, alignItems: 'center', paddingHorizontal: spacing.lg },
  headerTitle: { ...typography.h2, color: colors.textInverse, textAlign: 'center' },
  headerSub: { ...typography.caption, color: 'rgba(255,255,255,0.7)', marginTop: spacing.xs, textAlign: 'center' },
  availBadge: {
    marginTop: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: radius.full,
  },
  availText: { fontSize: 13, fontWeight: '700', color: colors.textInverse },

  lotBar: { maxHeight: 48, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  lotBarContent: { paddingHorizontal: spacing.md, gap: spacing.sm, alignItems: 'center' },
  lotPill: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.border,
  },
  lotPillSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  lotPillText: { ...typography.caption, fontWeight: '600', color: colors.textSecondary },
  lotPillTextSelected: { color: colors.textInverse },

  floorBar: { maxHeight: 68, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  floorBarContent: { paddingHorizontal: spacing.md, gap: spacing.sm, alignItems: 'center' },
  floorPill: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center',
  },
  floorPillSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  floorPillText: { ...typography.caption, fontWeight: '700', color: colors.textSecondary },
  floorPillTextSelected: { color: colors.primary },
  floorOccupancy: { fontSize: 10, color: colors.textMuted, marginTop: 2 },

  // Search section
  searchSection: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  searchPrompt: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
  },
  searchPromptIcon: { fontSize: 16 },
  searchPromptText: { ...typography.caption, fontWeight: '600', color: colors.primary, flex: 1 },
  searchPromptChevron: { fontSize: 18, color: colors.primaryMuted },

  searchBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
  },
  searchBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  searchBannerIcon: { fontSize: 16 },
  searchBannerLabel: { ...typography.caption, fontWeight: '700', color: colors.textPrimary },
  searchBannerSub: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  clearBtn: {
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.border,
  },
  clearBtnText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: radius.full,
    backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.sm,
  },

  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerTitle: { ...typography.h3 },
  pickerClose: { fontSize: 18, color: colors.textMuted, padding: spacing.xs },
  pickerLabel: { ...typography.label, marginTop: spacing.xs },

  chipScroll: { maxHeight: 36 },
  chipRow: { gap: spacing.xs, paddingRight: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipDisabled: { opacity: 0.35 },
  chipText: { ...typography.caption, fontWeight: '600', color: colors.textSecondary },
  chipTextSelected: { color: colors.textInverse },
  chipTextDisabled: { color: colors.textMuted },

  durationRow: { flexDirection: 'row', gap: spacing.sm },
  durationChip: {
    flex: 1, height: 40, borderRadius: radius.sm,
    borderWidth: 1.5, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  durationChipSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  durationChipText: { ...typography.caption, fontWeight: '600', color: colors.textSecondary },
  durationChipTextSelected: { color: colors.primary, fontWeight: '700' },

  searchBtn: { borderRadius: radius.md, overflow: 'hidden', marginTop: spacing.xs },
  searchBtnInner: { padding: spacing.md, alignItems: 'center' },
  searchBtnText: { ...typography.button },

  forecastBtn: {
    padding: spacing.md, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center',
  },
  forecastBtnText: { ...typography.caption, fontWeight: '600', color: colors.primary },

  legend: { flexDirection: 'row', gap: spacing.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 10, height: 10, borderRadius: radius.full },
  legendLabel: { ...typography.caption },

  grid: { padding: spacing.md, paddingBottom: spacing.xxl },
  gridRow: { gap: spacing.sm, justifyContent: 'flex-start' },
  spotCell: {
    width: 52, height: 52, borderRadius: radius.sm,
    borderWidth: 1.5, margin: 4,
    justifyContent: 'center', alignItems: 'center',
  },
  spotDot: { width: 16, height: 16, borderRadius: radius.full },
  spotTypeIcon: { fontSize: 18 },

  spotLoading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  emptyText: { ...typography.body, color: colors.textMuted },
});
