import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import AdminAnalyticsScreen from '../screens/admin/AdminAnalyticsScreen';
import AdminBookingDetailScreen from '../screens/admin/AdminBookingDetailScreen';
import AdminBookingManagementScreen from '../screens/admin/AdminBookingManagementScreen';
import AdminCreateBookingScreen from '../screens/admin/AdminCreateBookingScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import SpotControlScreen from '../screens/admin/SpotControlScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';

export type AdminStackParams = {
  AdminDashboard: undefined;
  Analytics: undefined;
  UserManagement: undefined;
  SpotControl: { floorId: string; floorLabel: string };
  BookingManagement: undefined;
  AdminBookingDetail: { bookingId: string };
  AdminCreateBooking: undefined;
};

const Stack = createNativeStackNavigator<AdminStackParams>();

export default function AdminStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Dashboard' }} />
      <Stack.Screen name="Analytics" component={AdminAnalyticsScreen} options={{ title: 'Analytics' }} />
      <Stack.Screen name="UserManagement" component={UserManagementScreen} options={{ title: 'Users' }} />
      <Stack.Screen name="SpotControl" component={SpotControlScreen} options={{ title: 'Spot Control' }} />
      <Stack.Screen name="BookingManagement" component={AdminBookingManagementScreen} options={{ title: 'Bookings' }} />
      <Stack.Screen name="AdminBookingDetail" component={AdminBookingDetailScreen} options={{ title: 'Booking Detail' }} />
      <Stack.Screen name="AdminCreateBooking" component={AdminCreateBookingScreen} options={{ title: 'Add Booking' }} />
    </Stack.Navigator>
  );
}
