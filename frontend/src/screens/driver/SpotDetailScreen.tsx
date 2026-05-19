import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MapStackParams } from '../../navigation/DriverTabs';
import { colors, gradients, radius, shadows, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<MapStackParams, 'SpotDetail'>;

const SPOT_TYPE_ICONS: Record<string, string> = { STANDARD: '🅿️', EV: '⚡', DISABLED: '♿' };
const SPOT_TYPE_LABELS: Record<string, string> = { STANDARD: 'Standard', EV: 'EV Charging', DISABLED: 'Accessible' };

const STATUS_CONFIG = {
  AVAILABLE: { label: 'Available', color: colors.available, bg: colors.available + '15' },
  OCCUPIED: { label: 'Occupied', color: colors.occupied, bg: colors.occupied + '15' },
  RESERVED: { label: 'Reserved', color: colors.reserved, bg: colors.reserved + '15' },
};

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Text style={styles.infoIcon}>{icon}</Text>
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function SpotDetailScreen({ navigation, route }: Props) {
  const { spot, floorLabel } = route.params;
  const status = STATUS_CONFIG[spot.status];
  const isAvailable = spot.status === 'AVAILABLE';

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.spotIconWrap}>
          <Text style={styles.spotIcon}>{SPOT_TYPE_ICONS[spot.spotType]}</Text>
        </View>
        <Text style={styles.spotTypeLabel}>{SPOT_TYPE_LABELS[spot.spotType]}</Text>
        <Text style={styles.spotId}>{floorLabel} · Spot #{spot.spotId.slice(-6).toUpperCase()}</Text>

        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: status.color }]} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={[styles.card, shadows.sm]}>
          <InfoRow icon="💰" label="Hourly Rate" value={`$${spot.hourlyRate.toFixed(2)} / hr`} />
          <View style={styles.divider} />
          <InfoRow icon="🏷️" label="Type" value={SPOT_TYPE_LABELS[spot.spotType]} />
          <View style={styles.divider} />
          <InfoRow icon="📍" label="Status" value={status.label} />
        </View>

        {isAvailable ? (
          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() => navigation.navigate('BookingForm', { spot })}
            activeOpacity={0.85}
          >
            <LinearGradient colors={gradients.primaryHorizontal} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.bookBtnInner}>
              <Text style={styles.bookBtnText}>Book This Spot</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={[styles.unavailableCard, { borderColor: status.color + '40', backgroundColor: status.bg }]}>
            <Text style={[styles.unavailableText, { color: status.color }]}>
              This spot is currently {status.label.toLowerCase()}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    paddingTop: 24, paddingBottom: spacing.xl,
    alignItems: 'center', overflow: 'hidden',
  },
  spotIconWrap: {
    width: 88, height: 88, borderRadius: radius.xl,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md,
  },
  spotIcon: { fontSize: 44 },
  spotTypeLabel: { ...typography.h2, color: colors.textInverse },
  spotId: { ...typography.caption, color: 'rgba(255,255,255,0.7)', marginTop: spacing.xs, marginBottom: spacing.md },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  statusDot: { width: 8, height: 8, borderRadius: radius.full },
  statusText: { fontSize: 14, fontWeight: '700' },

  body: { flex: 1 },
  bodyContent: { padding: spacing.lg, paddingBottom: spacing.xxl },

  card: { backgroundColor: colors.surface, borderRadius: radius.lg, marginBottom: spacing.lg, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  infoIconWrap: {
    width: 40, height: 40, borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  infoIcon: { fontSize: 20 },
  infoContent: { flex: 1 },
  infoLabel: { ...typography.caption },
  infoValue: { ...typography.bodySemiBold, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.borderLight, marginHorizontal: spacing.md },

  bookBtn: { borderRadius: radius.md, overflow: 'hidden' },
  bookBtnInner: { padding: spacing.md, alignItems: 'center' },
  bookBtnText: { ...typography.button },

  unavailableCard: {
    borderWidth: 1.5, borderRadius: radius.lg,
    padding: spacing.lg, alignItems: 'center',
  },
  unavailableText: { ...typography.bodyMedium, textAlign: 'center' },
});
