import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import * as vehiclesApi from '../../api/vehicles';
import { ProfileStackParams } from '../../navigation/DriverTabs';
import { colors, gradients, radius, shadows, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<ProfileStackParams, 'AddVehicle'>;

const TYPES = [
  { key: 'GAS', label: '⛽ Gas', color: colors.vehicleGas },
  { key: 'EV', label: '⚡ Electric', color: colors.vehicleEv },
  { key: 'HYBRID', label: '🔋 Hybrid', color: colors.vehicleHybrid },
] as const;

type VehicleType = 'GAS' | 'EV' | 'HYBRID';

export default function AddVehicleScreen({ navigation }: Props) {
  const [plateNumber, setPlateNumber] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('GAS');
  const [isDisabled, setIsDisabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!plateNumber.trim() || !make.trim() || !model.trim()) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      await vehiclesApi.addVehicle({ plateNumber: plateNumber.trim().toUpperCase(), make: make.trim(), model: model.trim(), vehicleType, isDisabled });
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error ?? 'Could not add vehicle');
    } finally {
      setLoading(false);
    }
  };

  const selectedType = TYPES.find(t => t.key === vehicleType)!;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <View style={[styles.card, shadows.sm]}>
          <Text style={styles.sectionTitle}>Vehicle Details</Text>

          <Text style={styles.label}>Plate Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. ABC123"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            value={plateNumber}
            onChangeText={setPlateNumber}
          />

          <Text style={styles.label}>Make</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Toyota"
            placeholderTextColor={colors.textMuted}
            value={make}
            onChangeText={setMake}
          />

          <Text style={styles.label}>Model</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Camry"
            placeholderTextColor={colors.textMuted}
            value={model}
            onChangeText={setModel}
          />
        </View>

        <View style={[styles.card, shadows.sm]}>
          <Text style={styles.sectionTitle}>Vehicle Type</Text>
          <View style={styles.typeRow}>
            {TYPES.map(t => (
              <TouchableOpacity
                key={t.key}
                style={[
                  styles.typeChip,
                  vehicleType === t.key && { backgroundColor: t.color + '20', borderColor: t.color },
                ]}
                onPress={() => setVehicleType(t.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.typeChipText, vehicleType === t.key && { color: t.color }]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.card, shadows.sm]}>
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Disability Permit</Text>
              <Text style={styles.switchSubLabel}>Enables access to disabled parking spots</Text>
            </View>
            <Switch
              value={isDisabled}
              onValueChange={setIsDisabled}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={isDisabled ? colors.primary : colors.textMuted}
            />
          </View>
        </View>

        <View style={[styles.previewCard, { borderColor: selectedType.color + '40', backgroundColor: selectedType.color + '10' }]}>
          <Text style={styles.previewLabel}>Preview</Text>
          <Text style={styles.previewText}>
            {plateNumber.trim().toUpperCase() || '—'} · {make.trim() || '—'} {model.trim() || '—'}
          </Text>
          <Text style={[styles.previewType, { color: selectedType.color }]}>{selectedType.label}</Text>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={handleAdd} disabled={loading} activeOpacity={0.85}>
          <LinearGradient colors={gradients.primaryHorizontal} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.addBtnInner}>
            <Text style={styles.addBtnText}>{loading ? 'Adding…' : 'Add Vehicle'}</Text>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },

  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.lg, marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.h3, marginBottom: spacing.md },

  label: { ...typography.label, marginBottom: spacing.xs },
  input: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
    padding: spacing.md, ...typography.body, marginBottom: spacing.md,
    backgroundColor: colors.background,
  },

  typeRow: { flexDirection: 'row', gap: spacing.sm },
  typeChip: {
    flex: 1, paddingVertical: spacing.sm, paddingHorizontal: spacing.xs,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center',
  },
  typeChipText: { ...typography.caption, fontWeight: '600', color: colors.textSecondary },

  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  switchInfo: { flex: 1 },
  switchLabel: { ...typography.bodyMedium },
  switchSubLabel: { ...typography.caption, marginTop: 2 },

  previewCard: {
    borderWidth: 1.5, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.lg, alignItems: 'center',
  },
  previewLabel: { ...typography.label, marginBottom: spacing.xs },
  previewText: { ...typography.bodySemiBold, marginBottom: spacing.xs },
  previewType: { fontSize: 14, fontWeight: '700' },

  addBtn: { borderRadius: radius.md, overflow: 'hidden' },
  addBtnInner: { padding: spacing.md, alignItems: 'center' },
  addBtnText: { ...typography.button },
});
