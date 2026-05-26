import client from './client';
import { AdminCreateBookingRequest, BookingResponse, CreateBookingRequest, EditBookingRequest, ExtendBookingRequest } from '../types';

export const createBooking = (data: CreateBookingRequest) =>
  client.post<BookingResponse>('/api/bookings', data);

export const getActiveBookings = (userId: string) =>
  client.get<BookingResponse[]>(`/api/bookings/user/${userId}/active`);

export const getAllBookings = (userId: string) =>
  client.get<BookingResponse[]>(`/api/bookings/user/${userId}`);

export const getBooking = (bookingId: string) =>
  client.get<BookingResponse>(`/api/bookings/${bookingId}`);

export const cancelBooking = (bookingId: string) =>
  client.post(`/api/bookings/${bookingId}/cancel`);

export const extendBooking = (bookingId: string, data: ExtendBookingRequest) =>
  client.put<BookingResponse>(`/api/bookings/${bookingId}/extend`, data);

export const editBooking = (bookingId: string, data: EditBookingRequest) =>
  client.put<BookingResponse>(`/api/bookings/${bookingId}`, data);

export const getAllBookingsAdmin = () =>
  client.get<BookingResponse[]>('/api/bookings/admin/all');

export const adminCreateBooking = (data: AdminCreateBookingRequest) =>
  client.post<BookingResponse>('/api/bookings/admin/create', data);

export const deleteBooking = (bookingId: string) =>
  client.delete(`/api/bookings/${bookingId}`);

export const checkInBooking = (bookingId: string) =>
  client.post<BookingResponse>(`/api/bookings/${bookingId}/checkin`);
