import client from './client';
import { RecommendationResponse } from '../types';

export const getRecommendation = (vehicleId: string) =>
  client.post<RecommendationResponse>('/api/recommendations', { vehicleId });
