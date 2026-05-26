import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as lotsApi from '../../api/lots';
import { useAuth } from '../../context/AuthContext';
import { AdminStackParams } from '../../navigation/AdminStack';
import { colors, gradients, radius, shadows, spacing, typography } from '../../theme';
import { ParkingFloorResponse, ParkingLotResponse } from '../../types';

type Props = NativeStackScreenProps<AdminStackParams, 'AdminDashboard'>;

function StatCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={[styles.statCard, shadows.sm, { borderTopColor: color, borderTopWidth: 3 }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function AdminDashboardScreen({ navigation }: Props) {
  const { email, logout } = useAuth();
  const [lots, setLots] = useState<ParkingLotResponse[]>([]);
  const [floorsByLot, setFloorsByLot] = useState<Record<string, ParkingFloorResponse[]>>({});
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      lotsApi.getLots().then(async res => {
        setLots(res.data);
        const map: Record<string, ParkingFloorResponse[]> = {};
        await Promise.all(res.data.map(async lot => {
          const fr = await lotsApi.getFloors(lot.lotId);
          map[lot.lotId] = fr.data;
        }));
        setFloorsByLot(map);
      }).catch(() => Alert.alert('Error', 'Could not load lot data')).finally(() => setLoading(false));
    }, [])
  );

  const totalFloors = Object.values(floorsByLot).reduce((sum, floors) => sum + floors.length, 0);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.decorCircle} />
        <View style={styles.adminBadge}>
          <Text style={styles.adminBadgeText}>ADMIN</Text>
        </View>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSub}>{email}</Text>
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard value={String(lots.length)} label="Lots" color={colors.primary} />
          <StatCard value={String(totalFloors)} label="Floors" color={colors.info} />
        </View>

        <Text style={styles.sectionTitle}>Management</Text>
        <TouchableOpacity style={[styles.actionCard, shadows.sm]} onPress={() => navigation.navigate('UserManagement')} activeOpacity={0.85}>
          <View style={[styles.actionIcon, { backgroundColor: colors.info + '20' }]}>
            <Text style={styles.actionIconText}>👥</Text>
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>User Management</Text>
            <Text style={styles.actionSubtitle}>Search, suspend, or reactivate users</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionCard, shadows.sm]} onPress={() => navigation.navigate('BookingManagement')} activeOpacity={0.85}>
          <View style={[styles.actionIcon, { backgroundColor: colors.success + '20' }]}>
            <Text style={styles.actionIconText}>📋</Text>
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Booking Management</Text>
            <Text style={styles.actionSubtitle}>View, edit, add, or delete bookings</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionCard, shadows.sm]} onPress={() => navigation.navigate('Analytics')} activeOpacity={0.85}>
          <View style={[styles.actionIcon, { backgroundColor: colors.warning + '20' }]}>
            <Text style={styles.actionIconText}>📊</Text>
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Analytics</Text>
            <Text style={styles.actionSubtitle}>Peak hours, utilisation, and occupancy trends</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Spot Control</Text>
        {loading ? (
          <Text style={styles.loadingText}>Loading floors…</Text>
        ) : lots.length === 0 ? (
          <Text style={styles.loadingText}>No lots found</Text>
        ) : (
          lots.map(lot => (
            <View key={lot.lotId} style={[styles.lotSection, shadows.sm]}>
              <View style={styles.lotHeader}>
                <Text style={styles.lotName}>{lot.name}</Text>
                <Text style={styles.lotAddress}>{lot.address}</Text>
              </View>
              {(floorsByLot[lot.lotId] ?? []).map((floor, i, arr) => (
                <View key={floor.floorId}>
                  <TouchableOpacity
                    style={styles.floorRow}
                    onPress={() => navigation.navigate('SpotControl', { floorId: floor.floorId, floorLabel: floor.floorLabel })}
                    activeOpacity={0.8}
                  >
                    <View style={styles.floorInfo}>
                      <Text style={styles.floorLabel}>{floor.floorLabel}</Text>
                      <Text style={styles.floorOccupancy}>
                        {Math.round(floor.occupancyRate * 100)}% occupied · {floor.capacity} spots
                      </Text>
                    </View>
                    <View style={[styles.occupancyBar]}>
                      <View style={[styles.occupancyFill, {
                        width: `${Math.round(floor.occupancyRate * 100)}%`,
                        backgroundColor: floor.occupancyRate > 0.8 ? colors.danger : floor.occupancyRate > 0.5 ? colors.warning : colors.success,
                      }]} />
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>
                  {i < arr.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          ))
        )}

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: { paddingTop: spacing.xl, paddingBottom: spacing.xl, alignItems: 'center', overflow: 'hidden' },
  decorCircle: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -60, right: -40,
  },
  adminBadge: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: radius.full, marginBottom: spacing.sm,
  },
  adminBadgeText: { fontSize: 11, fontWeight: '800', color: colors.textInverse, letterSpacing: 1.5 },
  headerTitle: { ...typography.h2, color: colors.textInverse },
  headerSub: { ...typography.caption, color: 'rgba(255,255,255,0.7)', marginTop: spacing.xs },

  body: { flex: 1 },
  bodyContent: { padding: spacing.lg, paddingBottom: spacing.xxl },

  sectionTitle: { ...typography.label, marginBottom: spacing.sm, marginTop: spacing.xs },

  statsGrid: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  statCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, alignItems: 'center', gap: spacing.xs,
  },
  statValue: { fontSize: 28, fontWeight: '800' },
  statLabel: { ...typography.caption },

  actionCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, gap: spacing.md, marginBottom: spacing.lg,
  },
  actionIcon: { width: 48, height: 48, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  actionIconText: { fontSize: 24 },
  actionInfo: { flex: 1 },
  actionTitle: { ...typography.bodySemiBold },
  actionSubtitle: { ...typography.caption, marginTop: 2 },
  chevron: { fontSize: 22, color: colors.primaryMuted },

  lotSection: { backgroundColor: colors.surface, borderRadius: radius.lg, marginBottom: spacing.md, overflow: 'hidden' },
  lotHeader: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  lotName: { ...typography.bodySemiBold },
  lotAddress: { ...typography.caption, marginTop: 2 },
  floorRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  floorInfo: { flex: 1 },
  floorLabel: { ...typography.bodyMedium },
  floorOccupancy: { ...typography.caption, marginTop: 2 },
  occupancyBar: { width: 60, height: 6, backgroundColor: colors.borderLight, borderRadius: radius.full, overflow: 'hidden' },
  occupancyFill: { height: 6, borderRadius: radius.full },
  divider: { height: 1, backgroundColor: colors.borderLight, marginHorizontal: spacing.md },

  loadingText: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.lg },

  logoutBtn: {
    borderWidth: 1.5, borderColor: colors.danger,
    borderRadius: radius.md, padding: spacing.md,
    alignItems: 'center', marginTop: spacing.md,
  },
  logoutText: { ...typography.button, color: colors.danger },
});
