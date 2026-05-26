import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';

// Android emulator routes localhost through 10.0.2.2 to reach the host machine.
const HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

const client = axios.create({
  baseURL: `http://${HOST}:8000`,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const WS_URL = `ws://${HOST}:8000/ws/websocket`;

export default client;
