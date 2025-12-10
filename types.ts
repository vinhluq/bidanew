
export enum GameType {
  CAROM = 'CAROM',
  LIBRE = 'LIBRE',
  POOL = 'POOL'
}

export enum GameMode {
  QUICK = 'Nhanh',
  TIME = 'Thời gian',
  ELIMINATION = 'Loại trừ',
  TOURNAMENT = 'Thi đấu'
}

export interface Player {
  id: string;
  name: string;
  handicap?: number;
  avatar?: string;
}

export interface MatchSettings {
  gameType: GameType;
  subType?: string; // e.g., "1 Băng", "3 Băng", "9 Bi", "15 Bi"
  gameMode: GameMode;
  numPlayers: number;
  targetScore?: number; // Optional target score
  shotSeconds?: number; // Time per turn
  timerSeconds?: number; // For specific Time mode settings if needed
  players: Player[];
  tableId?: string; // ID of the table in Club Manager
}

export interface MatchStats {
  score: number;
  innings: number; // Lượt cơ
  highRun: number; // Điểm cao nhất 1 lượt
  avg: number;
}

export interface MatchHistoryItem {
  id: string;
  date: string;
  type: string;
  player1Name: string;
  player2Name: string;
  score1: number;
  score2: number;
  winnerId: string;
}

export interface AppState {
  isAuthenticated: boolean;
  currentUser: { name: string; role: 'club' | 'player' } | null;
  activeMatch: MatchSettings | null;
}

// --- Club Management Types ---

export enum TableStatus {
  AVAILABLE = 'Trống',
  OCCUPIED = 'Đang chơi',
  MAINTENANCE = 'Bảo trì',
  LOCKED = 'Đang khóa'
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: 'drink' | 'food' | 'other';
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Table {
  id: string;
  name: string;
  type: GameType; 
  status: TableStatus;
  startTime?: number; // Timestamp when session started
  currentSessionId?: string;
  cameraUrl?: string; // RTSP or HTTP stream URL
  cameraStatus?: 'online' | 'offline'; // Status of the camera connection
  orders: OrderItem[]; // List of ordered items
  password?: string; // Password to unlock the table after checkout
}

export interface Bill {
  id: string;
  tableId: string;
  tableName: string;
  startTime: number;
  endTime: number;
  durationMinutes: number;
  hourlyRate: number;
  serviceTotal: number;
  totalAmount: number;
}

export interface PriceConfig {
    [GameType.CAROM]: number;
    [GameType.POOL]: number;
    [GameType.LIBRE]: number;
}

export interface TimeSlot {
    id: string;
    name: string;
    startHour: number;
    endHour: number;
    multiplier: number; // 0.8 for 20% discount, 1.2 for 20% increase
}
