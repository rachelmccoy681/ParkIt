import client from './client';
import { AuthResponse } from '../types';

export const login = (username: string, password: string) =>
  client.post<AuthResponse>('/api/auth/login', { username, password });

export const register = (email: string, password: string, username: string) =>
  client.post('/api/users/register', { email, password, username });

export const verifyEmail = (email: string, code: string) =>
  client.post('/api/auth/verify-email', { email, code });

export const forgotPassword = (email: string) =>
  client.post('/api/auth/forgot-password', { email });

export const resetPassword = (email: string, code: string, newPassword: string) =>
  client.post('/api/auth/reset-password', { email, code, newPassword });
