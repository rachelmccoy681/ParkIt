import client from './client';
import { PeakHourPoint, UtilizationSummary } from '../types';

export const getPeakHours = (floorId: string, days: number) =>
  client.get<PeakHourPoint[]>('/api/analytics/peak-hours', { params: { floorId, days } });

export const getUtilization = (floorId: string, days: number) =>
  client.get<UtilizationSummary>('/api/analytics/utilization', { params: { floorId, days } });
