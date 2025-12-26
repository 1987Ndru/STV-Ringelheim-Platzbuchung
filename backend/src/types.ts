export enum UserRole {
  GUEST = 'GUEST',
  MEMBER = 'MEMBER',
  ADMIN = 'ADMIN',
  TRAINER = 'TRAINER'
}

export enum AccountStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum BookingType {
  FREE = 'FREE',
  VM = 'VM',
  TRAINING = 'TRAINING',
  MATCH = 'MATCH',
  MAINTENANCE = 'MAINTENANCE'
}

export enum VMType {
  SINGLES = 'SINGLES',
  DOUBLES = 'DOUBLES',
  MIXED = 'MIXED'
}

export interface User {
  _id?: string;
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  status: AccountStatus;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Court {
  id: number;
  name: string;
}

export interface Booking {
  _id?: string;
  id?: string;
  courtId: number;
  userId: string;
  userName: string;
  date: string; // YYYY-MM-DD
  hour: number; // 8-21
  timestamp: number;
  type: BookingType;
  description?: string;
  vmType?: VMType;
  opponent?: string;
  opponent2?: string;
  partner?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthRequest extends Express.Request {
  user?: User;
}

