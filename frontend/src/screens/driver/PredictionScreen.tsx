import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as predictionsApi from '../../api/predictions';
import { ExploreStackParams } from '../../navigation/DriverTabs';
import { colors, gradients, radius, shadows, spacing, typography } from '../../theme';
import { PredictionResponse } from '../../types';

type Props = NativeStackScreenProps<ExploreStackParams, 'Prediction'>;

const SCREEN_WIDTH = Dimensions.get('window').width;
const BAR_MAX_WIDTH = SCREEN_WIDTH - spacing.lg * 2 - spacing.lg * 2 - 56;

function availabilityColor(rate: number): string {
  if (rate >= 0.6) return colors.available;
  if (rate >= 0.3) return colors.reserved;
  return colors.occupied;
}

function availabilityLabel(rate: number): string {
  if (rate >= 0.6) return 'High';
  if (rate >= 0.3) return 'Medium';
  return 'Low';
}

export default function PredictionScreen({ route }: Props) {
  const { floorId, floorLabel } = route.params;
  const [predictions, setPredictions] = useState<PredictionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchPredictions = () => {
    setLoading(true);
    predictionsApi.getPredictions(floorId)
      .then(res => setPredictions(res.data))
      .catch(() => setPredictions([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPredictions(); }, [floorId]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await predictionsApi.generatePredictions(floorId);
      fetchPredictions();
    } catch {
      Alert.alert('Error', 'Could not generate predictions');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <Text style={styles.headerTitle}>Availability Forecast</Text>
        <Text style={styles.headerSub}>{floorLabel}</Text>
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.legendRow}>
          {[{ color: colors.available, label: 'High' }, { color: colors.reserved, label: 'Medium' }, { color: colors.occupied, label: 'Low' }].map(l => (
            <View key={l.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: l.color }]} />
              <Text style={styles.legendText}>{l.label}</Text>
            </View>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <Text style={styles.loadingText}>Loading predictions…</Text>
          </View>
        ) : predictions.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>No predictions yet</Text>
            <Text style={styles.emptySubtitle}>Generate predictions to see availability forecast</Text>
          </View>
        ) : (
          <View style={[styles.card, shadows.sm]}>
            {predictions.map((p, i) => {
              const color = availabilityColor(p.predictedAvailability);
              const barWidth = BAR_MAX_WIDTH * p.predictedAvailability;
              return (
                <View key={p.predictionId}>
                  <View style={styles.predRow}>
                    <Text style={styles.timeSlot}>{p.timeSlot}</Text>
                    <View style={styles.barContainer}>
                      <View style={[styles.barBg]}>
                        <View style={[styles.barFill, { width: barWidth, backgroundColor: color }]} />
                      </View>
                      <Text style={[styles.availLabel, { color }]}>{availabilityLabel(p.predictedAvailability)}</Text>
                    </View>
                    <Text style={[styles.pct, { color }]}>{Math.round(p.predictedAvailability * 100)}%</Text>
                  </View>
                  {i < predictions.length - 1 && <View style={styles.divider} />}
                </View>
              );
            })}
          </View>
        )}

        <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate} disabled={generating} activeOpacity={0.85}>
          <LinearGradient colors={gradients.primaryHorizontal} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.generateBtnInner}>
            <Text style={styles.generateBtnText}>{generating ? 'Generating…' : '🔄 Refresh Predictions'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: { paddingTop: 24, paddingBottom: spacing.xl, alignItems: 'center' },
  headerTitle: { ...typography.h2, color: colors.textInverse },
  headerSub: { ...typography.caption, color: 'rgba(255,255,255,0.7)', marginTop: spacing.xs },

  body: { flex: 1 },
  bodyContent: { padding: spacing.lg, paddingBottom: spacing.xxl },

  legendRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 10, height: 10, borderRadius: radius.full },
  legendText: { ...typography.caption, fontWeight: '600' },

  card: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.lg },
  predRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm },
  timeSlot: { ...typography.caption, fontWeight: '600', width: 50, color: colors.textSecondary },
  barContainer: { flex: 1, gap: 4 },
  barBg: {
    height: 8, backgroundColor: colors.borderLight,
    borderRadius: radius.full, overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: radius.full },
  availLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  pct: { fontSize: 13, fontWeight: '700', width: 38, textAlign: 'right' },
  divider: { height: 1, backgroundColor: colors.borderLight, marginHorizontal: spacing.md },

  loadingBox: { alignItems: 'center', paddingVertical: spacing.xl },
  loadingText: { ...typography.body, color: colors.textMuted },
  emptyBox: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { ...typography.h3, marginBottom: spacing.sm },
  emptySubtitle: { ...typography.caption, textAlign: 'center', marginBottom: spacing.lg },

  generateBtn: { borderRadius: radius.md, overflow: 'hidden' },
  generateBtnInner: { padding: spacing.md, alignItems: 'center' },
  generateBtnText: { ...typography.button },
});
