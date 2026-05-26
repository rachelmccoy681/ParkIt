import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as vehiclesApi from '../../api/vehicles';
import { ProfileStackParams } from '../../navigation/DriverTabs';
import { colors, gradients, radius, shadows, spacing, typography } from '../../theme';
import { VehicleResponse } from '../../types';

type Props = NativeStackScreenProps<ProfileStackParams, 'VehicleList'>;

const VEHICLE_ICONS: Record<string, string> = { GAS: '⛽', EV: '⚡', HYBRID: '🔋' };
const VEHICLE_COLORS: Record<string, string> = {
  GAS: colors.vehicleGas, EV: colors.vehicleEv, HYBRID: colors.vehicleHybrid,
};

export default function VehicleListScreen({ navigation }: Props) {
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    vehiclesApi.getMyVehicles()
      .then(res => setVehicles(res.data))
      .catch(() => Alert.alert('Error', 'Could not load vehicles'))
      .finally(() => setLoading(false));
  }, []));

  const handleRemove = (vehicleId: string) => {
    Alert.alert('Remove Vehicle', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          try {
            await vehiclesApi.removeVehicle(vehicleId);
            setVehicles(prev => prev.filter(v => v.vehicleId !== vehicleId));
          } catch {
            Alert.alert('Error', 'Could not remove vehicle');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={vehicles}
        keyExtractor={v => v.vehicleId}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🚗</Text>
              <Text style={styles.emptyTitle}>No vehicles yet</Text>
              <Text style={styles.emptySubtitle}>Add your first vehicle to start booking</Text>
            </View>
          ) : null
        }
        renderItem={({ item: v }) => {
          const color = VEHICLE_COLORS[v.vehicleType];
          return (
            <View style={[styles.card, shadows.sm, { borderLeftColor: color, borderLeftWidth: 4 }]}>
              <View style={[styles.iconCircle, { backgroundColor: color + '20' }]}>
                <Text style={styles.icon}>{VEHICLE_ICONS[v.vehicleType]}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{v.make} {v.model}</Text>
                <Text style={[styles.plate, { color }]}>{v.plateNumber}</Text>
                <Text style={[styles.typeBadge, { color }]}>{v.vehicleType}</Text>
              </View>
              <TouchableOpacity onPress={() => handleRemove(v.vehicleId)} style={styles.removeBtn}>
                <Text style={styles.removeText}>✕</Text>
              </TouchableOpacity>
            </View>
          );
        }}
        ListFooterComponent={
          <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddVehicle')} activeOpacity={0.85}>
            <LinearGradient colors={gradients.primaryHorizontal} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.addBtnInner}>
              <Text style={styles.addBtnText}>+ Add Vehicle</Text>
            </LinearGradient>
          </TouchableOpacity>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.md, gap: spacing.md,
  },
  iconCircle: { width: 48, height: 48, borderRadius: radius.full, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 24 },
  info: { flex: 1 },
  name: { ...typography.bodySemiBold },
  plate: { ...typography.caption, fontWeight: '600', marginTop: 2 },
  typeBadge: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.xs },
  removeBtn: { padding: spacing.sm },
  removeText: { fontSize: 16, color: colors.textMuted },

  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyIcon: { fontSize: 56, marginBottom: spacing.md },
  emptyTitle: { ...typography.h3, marginBottom: spacing.sm },
  emptySubtitle: { ...typography.caption, textAlign: 'center' },

  addBtn: { borderRadius: radius.md, overflow: 'hidden', marginTop: spacing.sm },
  addBtnInner: { padding: spacing.md, alignItems: 'center' },
  addBtnText: { ...typography.button },
});
