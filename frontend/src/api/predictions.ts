import client from './client';
import { PredictionResponse } from '../types';

export const getPredictions = (floorId: string) =>
  client.get<PredictionResponse[]>(`/api/predictions/${floorId}`);

export const generatePredictions = (floorId: string) =>
  client.post(`/api/predictions/${floorId}/generate`);
