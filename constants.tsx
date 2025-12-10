import React from 'react';
import { MenuItem, Table, GameType, TableStatus, PriceConfig, TimeSlot } from './types';

// Icons will be used from lucide-react in the components, 
// keeping this file for static data configuration.

export const DEFAULT_PLAYER_1_NAME = "Người chơi 1";
export const DEFAULT_PLAYER_2_NAME = "Người chơi 2";

export const APP_COLORS = {
  primary: '#f97316', // Orange-500
  secondary: '#374151', // Gray-700
  bgDark: '#111827', // Gray-900
  success: '#22c55e', // Green-500
  danger: '#ef4444', // Red-500
};

export const MOCK_HISTORY = [
  {
    id: '1',
    date: '2023-10-25 14:30',
    type: 'Carom - 3 Băng',
    player1Name: 'Nguyễn Văn A',
    player2Name: 'Trần Văn B',
    score1: 40,
    score2: 32,
    winnerId: 'p1'
  },
  {
    id: '2',
    date: '2023-10-24 10:15',
    type: 'Pool - 9 Bi',
    player1Name: 'Lê Thị C',
    player2Name: 'Phạm Văn D',
    score1: 5,
    score2: 9,
    winnerId: 'p2'
  }
];

export const MENU_ITEMS: MenuItem[] = [
  { id: '1', name: 'Cà phê đen', price: 20000, category: 'drink' },
  { id: '2', name: 'Cà phê sữa', price: 25000, category: 'drink' },
  { id: '3', name: 'Nước suối', price: 10000, category: 'drink' },
  { id: '4', name: 'Sting dâu', price: 15000, category: 'drink' },
  { id: '5', name: 'Redbull', price: 20000, category: 'drink' },
  { id: '6', name: 'Trà đá', price: 5000, category: 'drink' },
  { id: '7', name: 'Mì trứng', price: 30000, category: 'food' },
  { id: '8', name: 'Mì bò', price: 40000, category: 'food' },
  { id: '9', name: 'Cơm chiên', price: 45000, category: 'food' },
  { id: '10', name: 'Thuốc lá (gói)', price: 35000, category: 'other' },
];

export const TABLES_STORAGE_KEY = 'bidapro_tables_data';
export const DEVICE_TABLE_ID_KEY = 'bidapro_device_table_id';
export const PRICING_STORAGE_KEY = 'bidapro_pricing_config';

export const DEFAULT_BASE_RATES: PriceConfig = {
    [GameType.CAROM]: 60000,
    [GameType.POOL]: 80000,
    [GameType.LIBRE]: 50000,
};

export const DEFAULT_TIME_SLOTS: TimeSlot[] = [
    { id: 'morning', name: 'Sáng (08:00 - 12:00)', startHour: 8, endHour: 12, multiplier: 0.7 }, // 30% off
    { id: 'evening', name: 'Tối (18:00 - 22:00)', startHour: 18, endHour: 22, multiplier: 1.0 },
];

export const INITIAL_TABLES: Table[] = [
  { id: '1', name: 'Bàn 01', type: GameType.CAROM, status: TableStatus.AVAILABLE, cameraUrl: 'rtsp://cam1', cameraStatus: 'online', orders: [] },
  { id: '2', name: 'Bàn 02', type: GameType.CAROM, status: TableStatus.AVAILABLE, cameraUrl: 'rtsp://cam2', cameraStatus: 'offline', orders: [] }, 
  { id: '3', name: 'Bàn 03', type: GameType.POOL, status: TableStatus.OCCUPIED, startTime: Date.now() - 3600000, orders: [{ menuItemId: '4', name: 'Sting dâu', price: 15000, quantity: 2 }] }, 
  { id: '4', name: 'Bàn 04', type: GameType.POOL, status: TableStatus.AVAILABLE, orders: [] },
  { id: '5', name: 'Bàn 05', type: GameType.LIBRE, status: TableStatus.AVAILABLE, orders: [] },
  { id: '6', name: 'Bàn VIP', type: GameType.CAROM, status: TableStatus.AVAILABLE, cameraUrl: 'rtsp://vip', cameraStatus: 'online', orders: [] },
];
