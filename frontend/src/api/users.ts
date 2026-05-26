import client from './client';
import { UserResponse } from '../types';

export const getUser = (userId: string) =>
  client.get<UserResponse>(`/api/users/${userId}`);

export const updateEmail = (userId: string, newEmail: string) =>
  client.put(`/api/users/${userId}/email`, { newEmail });

export const updatePassword = (userId: string, newPassword: string) =>
  client.put(`/api/users/${userId}/password`, { newPassword });

export const suspendUser = (userId: string) =>
  client.put(`/api/users/${userId}/suspend`);

export const reactivateUser = (userId: string) =>
  client.put(`/api/users/${userId}/reactivate`);

export const getUserByEmail = (email: string) =>
  client.get<UserResponse>(`/api/users/by-email`, { params: { email } });

export const updateUsername = (userId: string, newUsername: string) =>
  client.put(`/api/users/${userId}/username`, { newUsername });
