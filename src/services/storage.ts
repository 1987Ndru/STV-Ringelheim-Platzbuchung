import { User, Booking, UserRole, AccountStatus, Court } from '../types';

const USERS_KEY = 'stv_users';
const BOOKINGS_KEY = 'stv_bookings';
const CURRENT_USER_KEY = 'stv_current_user';

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
  
  getUsers: (): User[] => {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  },

  saveUser: (user: User): void => {
    const users = StorageService.getUsers();
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  updateUser: (updatedUser: User): void => {
    const users = StorageService.getUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
  },

  removeUser: (userId: string): void => {
    const users = StorageService.getUsers();
    const filteredUsers = users.filter(u => u.id !== userId);
    localStorage.setItem(USERS_KEY, JSON.stringify(filteredUsers));
    // Also remove all bookings from this user
    const bookings = StorageService.getBookings();
    const filteredBookings = bookings.filter(b => b.userId !== userId);
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(filteredBookings));
  },

  findUserByEmail: (email: string): User | undefined => {
    const users = StorageService.getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  // ============ BOOKINGS ============

  getBookings: (): Booking[] => {
    return JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '[]');
  },

  addBooking: (booking: Booking): void => {
    const bookings = StorageService.getBookings();
    bookings.push(booking);
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
  },

  updateBooking: (updatedBooking: Booking): void => {
    const bookings = StorageService.getBookings();
    const index = bookings.findIndex(b => b.id === updatedBooking.id);
    if (index !== -1) {
      bookings[index] = updatedBooking;
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
    }
  },

  removeBooking: (bookingId: string): void => {
    let bookings = StorageService.getBookings();
    bookings = bookings.filter(b => b.id !== bookingId);
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
  },

  // ============ AUTH HELPERS ============
  
  login: (email: string, password: string): User | null => {
    const user = StorageService.findUserByEmail(email);
    if (user && user.password === password) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      return user;
    }
    return null;
  },

  logout: (): void => {
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
