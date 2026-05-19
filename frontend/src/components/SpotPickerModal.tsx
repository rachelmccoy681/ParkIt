import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import { ParkingFloorResponse, ParkingSpotResponse } from '../types';

type Props = {
  visible: boolean;
  onClose: () => void;
  allFloors: ParkingFloorResponse[];
  selectedFloorId: string;
  onSelectFloor: (floorId: string) => void;
  currentSpots: ParkingSpotResponse[];
  selectedSpotId: string;
  onSelectSpot: (spotId: string) => void;
  currentBookingSpotId?: string;
};

export default function SpotPickerModal({
  visible, onClose, allFloors, selectedFloorId, onSelectFloor,
  currentSpots, selectedSpotId, onSelectSpot, currentBookingSpotId,
}: Props) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Spot</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.floorScroll}>
          {allFloors.map(f => (
            <TouchableOpacity
              key={f.floorId}
              style={[styles.floorPill, selectedFloorId === f.floorId && styles.floorPillActive]}
              onPress={() => onSelectFloor(f.floorId)}
              activeOpacity={0.8}
            >
              <Text style={[styles.floorPillText, selectedFloorId === f.floorId && styles.floorPillTextActive]}>
                {f.floorLabel}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.spotGrid}>
          {currentSpots.map(s => {
            const isSelected = s.spotId === selectedSpotId;
            const isCurrent = s.spotId === currentBookingSpotId;
            const unavailable = s.status !== 'AVAILABLE' && !isCurrent && !isSelected;
            return (
              <TouchableOpacity
                key={s.spotId}
                style={[
                  styles.spotCell,
                  isSelected && styles.spotCellSelected,
                  unavailable && styles.spotCellUnavailable,
                ]}
                onPress={() => !unavailable && onSelectSpot(s.spotId)}
                activeOpacity={0.8}
                disabled={unavailable}
              >
                <Text style={[styles.spotCellText, isSelected && styles.spotCellTextSelected]}>
                  {isSelected ? '✓' : s.spotId.slice(-3).toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.confirmBtn} onPress={onClose} activeOpacity={0.85}>
          <Text style={styles.confirmText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: spacing.lg, paddingBottom: spacing.xxl, maxHeight: '80%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  title: { ...typography.h3 },
  close: { fontSize: 18, color: colors.textMuted, padding: spacing.xs },

  floorScroll: { marginBottom: spacing.md },
  floorPill: {
    marginRight: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface,
  },
  floorPillActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  floorPillText: { ...typography.caption, fontWeight: '600', color: colors.textSecondary },
  floorPillTextActive: { color: colors.primary },

  spotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  spotCell: {
    width: '18%', aspectRatio: 1, borderRadius: radius.sm,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface,
    justifyContent: 'center', alignItems: 'center',
  },
  spotCellSelected: { borderWidth: 2.5, borderColor: colors.primary, backgroundColor: colors.primaryLight },
  spotCellUnavailable: { opacity: 0.35 },
  spotCellText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  spotCellTextSelected: { color: colors.primary },

  confirmBtn: { backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  confirmText: { ...typography.button },
});
