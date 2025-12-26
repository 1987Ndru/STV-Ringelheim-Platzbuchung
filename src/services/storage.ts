import { User, Booking, UserRole, AccountStatus, Court } from '../types';
import { FirebaseStorageService } from './firebaseStorage';

const USERS_KEY = 'stv_users';
const BOOKINGS_KEY = 'stv_bookings';
const CURRENT_USER_KEY = 'stv_current_user';

// Check if Firebase is configured
const isFirebaseConfigured = (): boolean => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  return apiKey && apiKey !== 'your-api-key' && apiKey !== '';
};

// Initial Data Seeding
const seedData = () => {
  if (!localStorage.getItem(USERS_KEY)) {
    const admin: User = {
      id: 'admin-1',
      email: 'admin@stv.de',
      fullName: 'Vorstand (Admin)',
      role: UserRole.ADMIN,
      status: AccountStatus.APPROVED,
      password: 'admin'
    };
    const trainer: User = {
      id: 'trainer-1',
      email: 'trainer@stv.de',
      fullName: 'Coach Esume',
      role: UserRole.TRAINER,
      status: AccountStatus.APPROVED,
      password: 'coach'
    };
    const demoUser: User = {
      id: 'user-1',
      email: 'demo@stv.de',
      fullName: 'Max Mustermann',
      role: UserRole.MEMBER,
      status: AccountStatus.APPROVED, // Pre-approved for testing
      password: 'demo'
    };
    localStorage.setItem(USERS_KEY, JSON.stringify([admin, trainer, demoUser]));
  }
  if (!localStorage.getItem(BOOKINGS_KEY)) {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify([]));
  }
};

seedData();

export const StorageService = {
  // ============ USERS ============
  
  getUsers: async (): Promise<User[]> => {
    if (isFirebaseConfigured()) {
      return await FirebaseStorageService.getUsers();
    }
    // Fallback to localStorage
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  },

  saveUser: async (user: User): Promise<void> => {
    if (isFirebaseConfigured()) {
      const newId = await FirebaseStorageService.saveUser(user);
      user.id = newId;
      return;
    }
    // Fallback to localStorage
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  updateUser: async (updatedUser: User): Promise<void> => {
    if (isFirebaseConfigured()) {
      await FirebaseStorageService.updateUser(updatedUser);
      return;
    }
    // Fallback to localStorage
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const index = users.findIndex((u: User) => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
  },

  removeUser: async (userId: string): Promise<void> => {
    if (isFirebaseConfigured()) {
      await FirebaseStorageService.removeUser(userId);
      return;
    }
    // Fallback to localStorage
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const filteredUsers = users.filter((u: User) => u.id !== userId);
    localStorage.setItem(USERS_KEY, JSON.stringify(filteredUsers));
    // Also remove all bookings from this user
    const bookings = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '[]');
    const filteredBookings = bookings.filter((b: Booking) => b.userId !== userId);
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(filteredBookings));
  },

  findUserByEmail: async (email: string): Promise<User | undefined> => {
    if (isFirebaseConfigured()) {
      return await FirebaseStorageService.findUserByEmail(email);
    }
    // Fallback to localStorage
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    return users.find((u: User) => u.email.toLowerCase() === email.toLowerCase());
  },

  // ============ BOOKINGS ============

  getBookings: async (): Promise<Booking[]> => {
    if (isFirebaseConfigured()) {
      return await FirebaseStorageService.getBookings();
    }
    // Fallback to localStorage
    return JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '[]');
  },

  addBooking: async (booking: Booking): Promise<void> => {
    if (isFirebaseConfigured()) {
      const newId = await FirebaseStorageService.addBooking(booking);
      booking.id = newId;
      return;
    }
    // Fallback to localStorage
    const bookings = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '[]');
    bookings.push(booking);
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
  },

  updateBooking: async (updatedBooking: Booking): Promise<void> => {
    if (isFirebaseConfigured()) {
      await FirebaseStorageService.updateBooking(updatedBooking);
      return;
    }
    // Fallback to localStorage
    const bookings = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '[]');
    const index = bookings.findIndex((b: Booking) => b.id === updatedBooking.id);
    if (index !== -1) {
      bookings[index] = updatedBooking;
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
    }
  },

  removeBooking: async (bookingId: string): Promise<void> => {
    if (isFirebaseConfigured()) {
      await FirebaseStorageService.removeBooking(bookingId);
      return;
    }
    // Fallback to localStorage
    let bookings = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '[]');
    bookings = bookings.filter((b: Booking) => b.id !== bookingId);
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
  },

  // ============ REAL-TIME SUBSCRIPTIONS ============

  subscribeToUsers: (callback: (users: User[]) => void): (() => void) | null => {
    if (isFirebaseConfigured()) {
      return FirebaseStorageService.subscribeToUsers(callback);
    }
    // Fallback: no real-time updates with localStorage
    return null;
  },

  subscribeToBookings: (callback: (bookings: Booking[]) => void): (() => void) | null => {
    if (isFirebaseConfigured()) {
      return FirebaseStorageService.subscribeToBookings(callback);
    }
    // Fallback: no real-time updates with localStorage
    return null;
  },

  subscribeToBookingsByDate: (date: string, callback: (bookings: Booking[]) => void): (() => void) | null => {
    if (isFirebaseConfigured()) {
      return FirebaseStorageService.subscribeToBookingsByDate(date, callback);
    }
    // Fallback: no real-time updates with localStorage
    return null;
  },

  // ============ AUTH HELPERS ============
  
  login: async (email: string, password: string): Promise<User | null> => {
    if (isFirebaseConfigured()) {
      return await FirebaseStorageService.login(email, password);
    }
    // Fallback to localStorage
    const user = await StorageService.findUserByEmail(email);
    if (user && user.password === password) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      return user;
    }
    return null;
  },

  logout: (): void => {
    if (isFirebaseConfigured()) {
      FirebaseStorageService.logout();
      return;
    }
    // Fallback to localStorage
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser: (): User | null => {
    if (isFirebaseConfigured()) {
      return FirebaseStorageService.getCurrentUser();
    }
    // Fallback to localStorage
    const data = localStorage.getItem(CURRENT_USER_KEY);
    return data ? JSON.parse(data) : null;
  }
};

export const COURTS: Court[] = [
  { id: 1, name: 'Platz 1' },
  { id: 2, name: 'Platz 2' },
  { id: 3, name: 'Platz 3' },
  { id: 4, name: 'Platz 4' },
];