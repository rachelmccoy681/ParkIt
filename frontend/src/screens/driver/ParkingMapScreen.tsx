import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, ScrollView,
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

function SpotCell({ spot, onPress }: { spot: ParkingSpotResponse; onPress: () => void }) {
  const color = STATUS_COLORS[spot.status];
  const isAvailable = spot.status === 'AVAILABLE';
  return (
    <TouchableOpacity
      style={[styles.spotCell, { backgroundColor: color + '20', borderColor: color }]}
      onPress={onPress}
      disabled={!isAvailable}
      activeOpacity={0.7}
    >
      {SPOT_TYPE_ICONS[spot.spotType] ? (
        <Text style={styles.spotTypeIcon}>{SPOT_TYPE_ICONS[spot.spotType]}</Text>
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

  useSpotUpdates((msg) => {
    setSpots(prev => prev.map(s =>
      s.spotId === msg.spotId ? { ...s, status: msg.status } : s
    ));
  });

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
    lotsApi.getFloors(selectedLot.lotId).then(res => {
      setFloors(res.data);
      if (res.data.length > 0) setSelectedFloor(res.data[0]);
    });
  }, [selectedLot]);

  useEffect(() => {
    if (!selectedFloor) return;
    setLoadingSpots(true);
    setSpots([]);
    lotsApi.getSpots(selectedFloor.floorId).then(res => {
      setSpots(res.data);
    }).finally(() => setLoadingSpots(false));
  }, [selectedFloor]);

  const availableCount = spots.filter(s => s.status === 'AVAILABLE').length;

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
            <Text style={styles.availText}>{availableCount} spots available</Text>
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

      <View style={styles.legend}>
        {[
          { status: 'AVAILABLE', label: 'Available' },
          { status: 'OCCUPIED', label: 'Occupied' },
          { status: 'RESERVED', label: 'Reserved' },
        ].map(({ status, label }) => (
          <View key={status} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS[status as keyof typeof STATUS_COLORS] }]} />
            <Text style={styles.legendLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {loadingSpots ? (
        <View style={styles.spotLoading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Loading spots…</Text>
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
              onPress={() => navigation.navigate('SpotDetail', { spot, floorLabel: selectedFloor?.floorLabel ?? '' })}
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

  floorBar: { maxHeight: 64, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
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
