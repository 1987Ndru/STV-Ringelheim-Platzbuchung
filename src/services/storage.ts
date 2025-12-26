import { User, Booking, UserRole, AccountStatus, Court } from '../types';
import { apiService } from './api';

const USERS_KEY = 'stv_users';
const BOOKINGS_KEY = 'stv_bookings';
const CURRENT_USER_KEY = 'stv_current_user';

// Check if API is configured
const isAPIConfigured = (): boolean => {
  const apiUrl = import.meta.env.VITE_API_URL;
  return apiUrl && apiUrl !== '';
};

export const StorageService = {
  // ============ USERS ============
  
  getUsers: async (): Promise<User[]> => {
    if (isAPIConfigured()) {
      try {
        const users = await apiService.getUsers();
        return users.map((u: any) => ({
          ...u,
          id: u.id || u._id
        }));
      } catch (error) {
        console.error('Error fetching users from API:', error);
        // Fallback to localStorage
        return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      }
    }
    // Fallback to localStorage
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  },

  saveUser: async (user: User): Promise<void> => {
    if (isAPIConfigured()) {
      try {
        await apiService.register({
          firstName: user.firstName || user.fullName.split(' ')[0],
          lastName: user.lastName || user.fullName.split(' ').slice(1).join(' '),
          email: user.email,
          password: user.password || '',
          passwordConfirm: user.password || ''
        });
        return;
      } catch (error) {
        console.error('Error saving user to API:', error);
        throw error;
      }
    }
    // Fallback to localStorage
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  updateUser: async (updatedUser: User): Promise<void> => {
    if (isAPIConfigured()) {
      try {
        const userId = updatedUser.id || updatedUser._id;
        if (updatedUser.status) {
          await apiService.updateUserStatus(userId!, updatedUser.status);
        }
        if (updatedUser.role) {
          await apiService.updateUserRole(userId!, updatedUser.role);
        }
        return;
      } catch (error) {
        console.error('Error updating user in API:', error);
        throw error;
      }
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
    if (isAPIConfigured()) {
      try {
        await apiService.deleteUser(userId);
        return;
      } catch (error) {
        console.error('Error deleting user from API:', error);
        throw error;
      }
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
    if (isAPIConfigured()) {
      try {
        const users = await apiService.getUsers();
        return users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
      } catch (error) {
        console.error('Error finding user in API:', error);
        // Fallback to localStorage
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        return users.find((u: User) => u.email.toLowerCase() === email.toLowerCase());
      }
    }
    // Fallback to localStorage
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    return users.find((u: User) => u.email.toLowerCase() === email.toLowerCase());
  },

  // ============ BOOKINGS ============

  getBookings: async (date?: string): Promise<Booking[]> => {
    if (isAPIConfigured()) {
      try {
        const bookings = await apiService.getBookings(date);
        return bookings.map((b: any) => ({
          ...b,
          id: b.id || b._id
        }));
      } catch (error) {
        console.error('Error fetching bookings from API:', error);
        // Fallback to localStorage
        const allBookings = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '[]');
        return date ? allBookings.filter((b: Booking) => b.date === date) : allBookings;
      }
    }
    // Fallback to localStorage
    const allBookings = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '[]');
    return date ? allBookings.filter((b: Booking) => b.date === date) : allBookings;
  },

  addBooking: async (booking: Booking): Promise<void> => {
    if (isAPIConfigured()) {
      try {
        const { id, ...bookingData } = booking;
        const result = await apiService.createBooking(bookingData);
        booking.id = result.id || result._id;
        return;
      } catch (error) {
        console.error('Error creating booking in API:', error);
        throw error;
      }
    }
    // Fallback to localStorage
    const bookings = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '[]');
    bookings.push(booking);
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
  },

  updateBooking: async (updatedBooking: Booking): Promise<void> => {
    if (isAPIConfigured()) {
      try {
        const bookingId = updatedBooking.id || updatedBooking._id;
        const { id, _id, ...bookingData } = updatedBooking;
        await apiService.updateBooking(bookingId!, bookingData);
        return;
      } catch (error) {
        console.error('Error updating booking in API:', error);
        throw error;
      }
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
    if (isAPIConfigured()) {
      try {
        await apiService.deleteBooking(bookingId);
        return;
      } catch (error) {
        console.error('Error deleting booking from API:', error);
        throw error;
      }
    }
    // Fallback to localStorage
    let bookings = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '[]');
    bookings = bookings.filter((b: Booking) => b.id !== bookingId);
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
  },

  // ============ REAL-TIME SUBSCRIPTIONS ============
  // Note: Real-time updates would require WebSockets or polling
  // For now, we'll use polling in the components

  subscribeToUsers: (callback: (users: User[]) => void): (() => void) | null => {
    // Polling implementation could be added here
    return null;
  },

  subscribeToBookings: (callback: (bookings: Booking[]) => void): (() => void) | null => {
    // Polling implementation could be added here
    return null;
  },

  subscribeToBookingsByDate: (date: string, callback: (bookings: Booking[]) => void): (() => void) | null => {
    // Polling implementation could be added here
    return null;
  },

  // ============ AUTH HELPERS ============
  
  login: async (email: string, password: string): Promise<User | null> => {
    if (isAPIConfigured()) {
      try {
        const result = await apiService.login(email, password);
        if (result.user) {
          const user = {
            ...result.user,
            id: result.user.id || result.user._id
          };
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
          return user as User;
        }
        return null;
      } catch (error) {
        console.error('Error logging in via API:', error);
        throw error;
      }
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
    if (isAPIConfigured()) {
      apiService.logout();
    }
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser: (): User | null => {
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