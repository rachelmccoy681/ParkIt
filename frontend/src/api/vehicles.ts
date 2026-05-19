import client from './client';
import { VehicleResponse, CreateVehicleRequest } from '../types';

export const getMyVehicles = () =>
  client.get<VehicleResponse[]>('/api/vehicles/my');

export const addVehicle = (data: CreateVehicleRequest) =>
  client.post<VehicleResponse>('/api/vehicles', data);

export const removeVehicle = (vehicleId: string) =>
  client.delete(`/api/vehicles/${vehicleId}`);

export const getUserVehicles = (userId: string) =>
  client.get<VehicleResponse[]>(`/api/vehicles/user/${userId}`);
