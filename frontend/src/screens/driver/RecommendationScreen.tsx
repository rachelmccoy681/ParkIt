import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as recommendationsApi from '../../api/recommendations';
import * as vehiclesApi from '../../api/vehicles';
import { ExploreStackParams } from '../../navigation/DriverTabs';
import { colors, gradients, radius, shadows, spacing, typography } from '../../theme';
import { RecommendationResponse, VehicleResponse } from '../../types';

type Props = NativeStackScreenProps<ExploreStackParams, 'Recommendation'>;

const VEHICLE_ICONS: Record<string, string> = { GAS: '⛽', EV: '⚡', HYBRID: '🔋' };

export default function RecommendationScreen({ navigation }: Props) {
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleResponse | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    vehiclesApi.getMyVehicles().then(res => {
      setVehicles(res.data);
      if (res.data.length > 0) setSelectedVehicle(res.data[0]);
    }).catch(() => Alert.alert('Error', 'Could not load vehicles'));
  }, []);

  const handleGetRecommendation = async () => {
    if (!selectedVehicle) return;
    setLoading(true);
    setRecommendation(null);
    try {
      const res = await recommendationsApi.getRecommendation(selectedVehicle.vehicleId);
      setRecommendation(res.data);
    } catch (err: any) {
      Alert.alert('No Recommendation', err.response?.data?.error ?? 'Could not generate recommendation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerIcon}>
          <Text style={styles.headerIconText}>✨</Text>
        </View>
        <Text style={styles.headerTitle}>Smart Recommendation</Text>
        <Text style={styles.headerSub}>Find the best spot for your vehicle</Text>
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Text style={styles.sectionTitle}>Your Vehicle</Text>
        {vehicles.length === 0 ? (
          <View style={[styles.card, styles.emptyCard]}>
            <Text style={styles.emptyText}>Add a vehicle in your profile to get recommendations.</Text>
          </View>
        ) : (
          <View style={[styles.card, shadows.sm]}>
            {vehicles.map((v, i) => {
              const selected = selectedVehicle?.vehicleId === v.vehicleId;
              return (
                <View key={v.vehicleId}>
                  <TouchableOpacity
                    style={[styles.vehicleRow, selected && styles.vehicleRowSelected]}
                    onPress={() => { setSelectedVehicle(v); setRecommendation(null); }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.vehicleIcon}>{VEHICLE_ICONS[v.vehicleType]}</Text>
                    <View style={styles.vehicleInfo}>
                      <Text style={styles.vehicleName}>{v.make} {v.model}</Text>
                      <Text style={styles.vehiclePlate}>{v.plateNumber}</Text>
                    </View>
                    {selected && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                  {i < vehicles.length - 1 && <View style={styles.divider} />}
                </View>
              );
            })}
          </View>
        )}

        <TouchableOpacity
          style={styles.recommendBtn}
          onPress={handleGetRecommendation}
          disabled={loading || !selectedVehicle}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={selectedVehicle ? gradients.primaryHorizontal : ['#C4B5FD', '#C4B5FD']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.recommendBtnInner}
          >
            <Text style={styles.recommendBtnText}>{loading ? 'Finding best spot…' : '✨ Get Recommendation'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {recommendation && (
          <View style={[styles.resultCard, shadows.md]}>
            <LinearGradient colors={['#EDE9FE', '#F8F7FF']} style={styles.resultHeader}>
              <Text style={styles.resultTitle}>Recommended Spot</Text>
              <Text style={styles.resultSpot}>Spot #{recommendation.suggestedSpotId.slice(-6).toUpperCase()}</Text>
            </LinearGradient>
            <View style={styles.resultBody}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Floor</Text>
                <Text style={styles.resultValue}>{recommendation.suggestedFloorId.slice(-6).toUpperCase()}</Text>
              </View>
              <View style={styles.reasonBox}>
                <Text style={styles.reasonLabel}>Why this spot?</Text>
                <Text style={styles.reasonText}>{recommendation.reason}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: { paddingTop: 24, paddingBottom: spacing.xl, alignItems: 'center' },
  headerIcon: {
    width: 72, height: 72, borderRadius: radius.xl,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md,
  },
  headerIconText: { fontSize: 36 },
  headerTitle: { ...typography.h2, color: colors.textInverse },
  headerSub: { ...typography.caption, color: 'rgba(255,255,255,0.7)', marginTop: spacing.xs },

  body: { flex: 1 },
  bodyContent: { padding: spacing.lg, paddingBottom: spacing.xxl },

  sectionTitle: { ...typography.label, marginBottom: spacing.sm },

  card: { backgroundColor: colors.surface, borderRadius: radius.lg, marginBottom: spacing.md, overflow: 'hidden' },
  emptyCard: { padding: spacing.lg, alignItems: 'center' },
  emptyText: { ...typography.caption, textAlign: 'center' },

  vehicleRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  vehicleRowSelected: { backgroundColor: colors.primaryLight },
  vehicleIcon: { fontSize: 24 },
  vehicleInfo: { flex: 1 },
  vehicleName: { ...typography.bodySemiBold },
  vehiclePlate: { ...typography.caption, marginTop: 2 },
  checkmark: { fontSize: 18, color: colors.primary, fontWeight: '700' },
  divider: { height: 1, backgroundColor: colors.borderLight, marginHorizontal: spacing.md },

  recommendBtn: { borderRadius: radius.md, overflow: 'hidden', marginBottom: spacing.lg },
  recommendBtnInner: { padding: spacing.md, alignItems: 'center' },
  recommendBtnText: { ...typography.button },

  resultCard: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden' },
  resultHeader: { padding: spacing.lg, alignItems: 'center' },
  resultTitle: { ...typography.label, marginBottom: spacing.xs },
  resultSpot: { fontSize: 28, fontWeight: '800', color: colors.primary },
  resultBody: { padding: spacing.lg },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  resultLabel: { ...typography.body, color: colors.textSecondary },
  resultValue: { ...typography.bodySemiBold },
  reasonBox: {
    backgroundColor: colors.primaryLight, borderRadius: radius.md,
    padding: spacing.md, borderLeftWidth: 3, borderLeftColor: colors.primary,
  },
  reasonLabel: { ...typography.label, marginBottom: spacing.xs },
  reasonText: { ...typography.body, color: colors.primaryDark },
});
