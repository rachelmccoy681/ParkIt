import client from './client';
import { ParkingLotResponse, ParkingFloorResponse, ParkingSpotResponse } from '../types';

export const getLots = () =>
  client.get<ParkingLotResponse[]>('/api/lots');

export const getFloors = (lotId: string) =>
  client.get<ParkingFloorResponse[]>(`/api/lots/${lotId}/floors`);

export const getSpots = (floorId: string) =>
  client.get<ParkingSpotResponse[]>(`/api/floors/${floorId}/spots`);

export const getAvailableSpots = (floorId: string) =>
  client.get<ParkingSpotResponse[]>(`/api/floors/${floorId}/spots/available`);

export const getSpot = (spotId: string) =>
  client.get<ParkingSpotResponse>(`/api/spots/${spotId}`);

export const updateSpotStatus = (spotId: string, status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED') =>
  client.put(`/api/spots/${spotId}/status`, { status });
