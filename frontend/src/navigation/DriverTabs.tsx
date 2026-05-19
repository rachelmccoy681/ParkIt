import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import AddVehicleScreen from '../screens/driver/AddVehicleScreen';
import BookingDetailScreen from '../screens/driver/BookingDetailScreen';
import EditBookingScreen from '../screens/driver/EditBookingScreen';
import BookingFormScreen from '../screens/driver/BookingFormScreen';
import DriverDashboardScreen from '../screens/driver/DriverDashboardScreen';
import MyBookingsScreen from '../screens/driver/MyBookingsScreen';
import ParkingMapScreen from '../screens/driver/ParkingMapScreen';
import PredictionScreen from '../screens/driver/PredictionScreen';
import ProfileScreen from '../screens/driver/ProfileScreen';
import RecommendationScreen from '../screens/driver/RecommendationScreen';
import SpotDetailScreen from '../screens/driver/SpotDetailScreen';
import VehicleListScreen from '../screens/driver/VehicleListScreen';
import { colors } from '../theme';
import { ParkingSpotResponse } from '../types';

export type MapStackParams = {
  ParkingMap: undefined;
  SpotDetail: { spot: ParkingSpotResponse; floorLabel: string };
  BookingForm: { spot: ParkingSpotResponse };
};

export type BookingsStackParams = {
  MyBookings: undefined;
  BookingDetail: { bookingId: string };
  EditBooking: { bookingId: string };
};

export type ExploreStackParams = {
  Recommendation: undefined;
  Prediction: { floorId: string; floorLabel: string };
};

export type ProfileStackParams = {
  ProfileHome: undefined;
  VehicleList: undefined;
  AddVehicle: undefined;
};

const MapStack = createNativeStackNavigator<MapStackParams>();
const BookingsStack = createNativeStackNavigator<BookingsStackParams>();
const ExploreStack = createNativeStackNavigator<ExploreStackParams>();
const ProfileStack = createNativeStackNavigator<ProfileStackParams>();
const Tab = createBottomTabNavigator();

function MapNavigator() {
  return (
    <MapStack.Navigator>
      <MapStack.Screen name="ParkingMap" component={ParkingMapScreen} options={{ title: 'Parking Map' }} />
      <MapStack.Screen name="SpotDetail" component={SpotDetailScreen} options={{ title: 'Spot Details' }} />
      <MapStack.Screen name="BookingForm" component={BookingFormScreen} options={{ title: 'Book Spot' }} />
    </MapStack.Navigator>
  );
}

function BookingsNavigator() {
  return (
    <BookingsStack.Navigator>
      <BookingsStack.Screen name="MyBookings" component={MyBookingsScreen} options={{ title: 'My Bookings' }} />
      <BookingsStack.Screen name="BookingDetail" component={BookingDetailScreen} options={{ title: 'Booking Details' }} />
      <BookingsStack.Screen name="EditBooking" component={EditBookingScreen} options={{ title: 'Edit Booking' }} />
    </BookingsStack.Navigator>
  );
}

function ExploreNavigator() {
  return (
    <ExploreStack.Navigator>
      <ExploreStack.Screen name="Recommendation" component={RecommendationScreen} options={{ title: 'Recommendation' }} />
      <ExploreStack.Screen name="Prediction" component={PredictionScreen} options={{ title: 'Availability Forecast' }} />
    </ExploreStack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} options={{ title: 'Profile' }} />
      <ProfileStack.Screen name="VehicleList" component={VehicleListScreen} options={{ title: 'My Vehicles' }} />
      <ProfileStack.Screen name="AddVehicle" component={AddVehicleScreen} options={{ title: 'Add Vehicle' }} />
    </ProfileStack.Navigator>
  );
}

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { focused: IoniconsName; outline: IoniconsName }> = {
  Home: { focused: 'home', outline: 'home-outline' },
  Map: { focused: 'map', outline: 'map-outline' },
  Bookings: { focused: 'calendar', outline: 'calendar-outline' },
  Explore: { focused: 'sparkles', outline: 'sparkles-outline' },
  Profile: { focused: 'person-circle', outline: 'person-circle-outline' },
};

export default function DriverTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { borderTopColor: colors.border, backgroundColor: colors.surface },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const cfg = TAB_ICONS[route.name];
          if (!cfg) return null;
          return <Ionicons name={focused ? cfg.focused : cfg.outline} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={DriverDashboardScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Map" component={MapNavigator} />
      <Tab.Screen name="Bookings" component={BookingsNavigator} />
      <Tab.Screen name="Explore" component={ExploreNavigator} />
      <Tab.Screen name="Profile" component={ProfileNavigator} />
    </Tab.Navigator>
  );
}
