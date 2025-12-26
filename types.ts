export enum UserRole {
  GUEST = 'GUEST',
  MEMBER = 'MEMBER', // Registered but pending or approved check via status
  ADMIN = 'ADMIN',
  TRAINER = 'TRAINER'
}

export enum AccountStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum BookingType {
  FREE = 'FREE',       // Freies Spielen
  VM = 'VM',           // Vereinsmeisterschaft
  TRAINING = 'TRAINING', // Training
  MATCH = 'MATCH',     // Spieltag
  MAINTENANCE = 'MAINTENANCE' // Platzpflege
}

export enum VMType {
  SINGLES = 'SINGLES', // Einzel
  DOUBLES = 'DOUBLES', // Doppel
  MIXED = 'MIXED'      // Mix
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: AccountStatus;
  password?: string; // In a real app, never store plain text. Used here for local simulation.
}

export interface Court {
  id: number;
  name: string;
}

export interface Booking {
  id: string;
  courtId: number;
  userId: string;
  userName: string;
  date: string; // YYYY-MM-DD
  hour: number; // 8-21
  timestamp: number;
  type: BookingType;
  description?: string; // Additional details (e.g. for Training)
  // VM Specifics
  vmType?: VMType;
  opponent?: string; // Einzel Gegner oder Gegner 1
  opponent2?: string; // Gegner 2 (nur Doppel/Mix)
  partner?: string;   // Partner (nur Doppel/Mix)
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}