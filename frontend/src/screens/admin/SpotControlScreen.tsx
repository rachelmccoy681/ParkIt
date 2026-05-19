import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as lotsApi from '../../api/lots';
import { AdminStackParams } from '../../navigation/AdminStack';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { ParkingSpotResponse } from '../../types';

type Props = NativeStackScreenProps<AdminStackParams, 'SpotControl'>;

const STATUS_CONFIG = {
  AVAILABLE: { color: colors.available, label: 'Available', next: 'OCCUPIED' as const },
  OCCUPIED: { color: colors.occupied, label: 'Occupied', next: 'AVAILABLE' as const },
  RESERVED: { color: colors.reserved, label: 'Reserved', next: 'AVAILABLE' as const },
};

const SPOT_TYPE_ICONS: Record<string, string> = { STANDARD: '🅿️', EV: '⚡', DISABLED: '♿' };

function SpotCard({ spot, onToggle }: { spot: ParkingSpotResponse; onToggle: () => void }) {
  const cfg = STATUS_CONFIG[spot.status];
  return (
    <TouchableOpacity
      style={[styles.spotCard, { borderColor: cfg.color + '60', backgroundColor: cfg.color + '12' }]}
      onPress={onToggle}
      activeOpacity={0.75}
    >
      <Text style={styles.spotTypeIcon}>{SPOT_TYPE_ICONS[spot.spotType]}</Text>
      <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
      <Text style={[styles.spotLabel, { color: cfg.color }]}>{cfg.label.slice(0, 3)}</Text>
    </TouchableOpacity>
  );
}

export default function SpotControlScreen({ route }: Props) {
  const { floorId, floorLabel } = route.params;
  const [spots, setSpots] = useState<ParkingSpotResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    lotsApi.getSpots(floorId)
      .then(res => setSpots(res.data))
      .catch(() => Alert.alert('Error', 'Could not load spots'))
      .finally(() => setLoading(false));
  }, [floorId]);

  const handleToggle = (spot: ParkingSpotResponse) => {
    const cfg = STATUS_CONFIG[spot.status];
    Alert.alert(
      'Change Status',
      `Set spot to ${cfg.next}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm', onPress: async () => {
            try {
              await lotsApi.updateSpotStatus(spot.spotId, cfg.next);
              setSpots(prev => prev.map(s => s.spotId === spot.spotId ? { ...s, status: cfg.next } : s));
            } catch {
              Alert.alert('Error', 'Could not update spot status');
            }
          },
        },
      ],
    );
  };

  const available = spots.filter(s => s.status === 'AVAILABLE').length;
  const occupied = spots.filter(s => s.status === 'OCCUPIED').length;
  const reserved = spots.filter(s => s.status === 'RESERVED').length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: colors.available }]} />
          <Text style={styles.statText}>{available} Available</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: colors.occupied }]} />
          <Text style={styles.statText}>{occupied} Occupied</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: colors.reserved }]} />
          <Text style={styles.statText}>{reserved} Reserved</Text>
        </View>
      </View>

      <View style={styles.hint}>
        <Text style={styles.hintText}>Tap a spot to toggle its status</Text>
      </View>

      <FlatList
        data={spots}
        keyExtractor={s => s.spotId}
        numColumns={4}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.gridRow}
        renderItem={({ item: spot }) => (
          <SpotCard spot={spot} onToggle={() => handleToggle(spot)} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  statsBar: {
    flexDirection: 'row', backgroundColor: colors.surface,
    padding: spacing.md, gap: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  statDot: { width: 10, height: 10, borderRadius: radius.full },
  statText: { ...typography.caption, fontWeight: '600' },

  hint: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  hintText: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },

  grid: { padding: spacing.md, paddingBottom: spacing.xxl },
  gridRow: { gap: spacing.sm, justifyContent: 'flex-start' },
  spotCard: {
    width: 70, height: 70, borderRadius: radius.md,
    borderWidth: 1.5, margin: 4,
    justifyContent: 'center', alignItems: 'center', gap: 4,
  },
  spotTypeIcon: { fontSize: 18 },
  statusDot: { width: 8, height: 8, borderRadius: radius.full },
  spotLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
});
