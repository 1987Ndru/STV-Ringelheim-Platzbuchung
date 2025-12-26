import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot,
  Timestamp,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from './firebase';
import { User, Booking, UserRole, AccountStatus } from '../types';

const USERS_COLLECTION = 'users';
const BOOKINGS_COLLECTION = 'bookings';

// Helper to convert Firestore timestamp to date string
const timestampToDateString = (timestamp: any): string => {
  if (timestamp?.toDate) {
    return timestamp.toDate().toISOString().split('T')[0];
  }
  if (timestamp?.seconds) {
    return new Date(timestamp.seconds * 1000).toISOString().split('T')[0];
  }
  return timestamp || new Date().toISOString().split('T')[0];
};

// Helper to convert date string to Firestore timestamp
const dateStringToTimestamp = (dateString: string): Timestamp => {
  return Timestamp.fromDate(new Date(dateString));
};

export const FirebaseStorageService = {
  // ============ USERS ============
  
  getUsers: async (): Promise<User[]> => {
    try {
      const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
      return usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  },

  saveUser: async (user: User): Promise<string> => {
    try {
      const { id, ...userData } = user;
      const docRef = await addDoc(collection(db, USERS_COLLECTION), userData);
      return docRef.id;
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  },

  updateUser: async (updatedUser: User): Promise<void> => {
    try {
      const { id, ...userData } = updatedUser;
      const userRef = doc(db, USERS_COLLECTION, id);
      await updateDoc(userRef, userData);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  removeUser: async (userId: string): Promise<void> => {
    try {
      // Delete user
      await deleteDoc(doc(db, USERS_COLLECTION, userId));
      
      // Delete all bookings from this user
      const bookingsQuery = query(
        collection(db, BOOKINGS_COLLECTION),
        where('userId', '==', userId)
      );
      const bookingsSnapshot = await getDocs(bookingsQuery);
      const deletePromises = bookingsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error removing user:', error);
      throw error;
    }
  },

  findUserByEmail: async (email: string): Promise<User | undefined> => {
    try {
      const usersQuery = query(
        collection(db, USERS_COLLECTION),
        where('email', '==', email.toLowerCase())
      );
      const usersSnapshot = await getDocs(usersQuery);
      if (!usersSnapshot.empty) {
        const userDoc = usersSnapshot.docs[0];
        return {
          id: userDoc.id,
          ...userDoc.data()
        } as User;
      }
      return undefined;
    } catch (error) {
      console.error('Error finding user:', error);
      return undefined;
    }
  },

  // ============ BOOKINGS ============

  getBookings: async (): Promise<Booking[]> => {
    try {
      const bookingsSnapshot = await getDocs(collection(db, BOOKINGS_COLLECTION));
      return bookingsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: timestampToDateString(data.date)
        } as Booking;
      });
    } catch (error) {
      console.error('Error getting bookings:', error);
      return [];
    }
  },

  getBookingsByDate: async (date: string): Promise<Booking[]> => {
    try {
      const dateTimestamp = dateStringToTimestamp(date);
      const bookingsQuery = query(
        collection(db, BOOKINGS_COLLECTION),
        where('date', '==', date)
      );
      const bookingsSnapshot = await getDocs(bookingsQuery);
      return bookingsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: timestampToDateString(data.date)
        } as Booking;
      });
    } catch (error) {
      console.error('Error getting bookings by date:', error);
      return [];
    }
  },

  addBooking: async (booking: Booking): Promise<string> => {
    try {
      const { id, ...bookingData } = booking;
      const docRef = await addDoc(collection(db, BOOKINGS_COLLECTION), bookingData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding booking:', error);
      throw error;
    }
  },

  updateBooking: async (updatedBooking: Booking): Promise<void> => {
    try {
      const { id, ...bookingData } = updatedBooking;
      const bookingRef = doc(db, BOOKINGS_COLLECTION, id);
      await updateDoc(bookingRef, bookingData);
    } catch (error) {
      console.error('Error updating booking:', error);
      throw error;
    }
  },

  removeBooking: async (bookingId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, BOOKINGS_COLLECTION, bookingId));
    } catch (error) {
      console.error('Error removing booking:', error);
      throw error;
    }
  },

  // ============ REAL-TIME SUBSCRIPTIONS ============

  subscribeToUsers: (callback: (users: User[]) => void): (() => void) => {
    const unsubscribe = onSnapshot(
      collection(db, USERS_COLLECTION),
      (snapshot: QuerySnapshot<DocumentData>) => {
        const users = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as User));
        callback(users);
      },
      (error) => {
        console.error('Error subscribing to users:', error);
      }
    );
    return unsubscribe;
  },

  subscribeToBookings: (callback: (bookings: Booking[]) => void): (() => void) => {
    const unsubscribe = onSnapshot(
      collection(db, BOOKINGS_COLLECTION),
      (snapshot: QuerySnapshot<DocumentData>) => {
        const bookings = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: timestampToDateString(data.date)
          } as Booking;
        });
        callback(bookings);
      },
      (error) => {
        console.error('Error subscribing to bookings:', error);
      }
    );
    return unsubscribe;
  },

  subscribeToBookingsByDate: (date: string, callback: (bookings: Booking[]) => void): (() => void) => {
    const bookingsQuery = query(
      collection(db, BOOKINGS_COLLECTION),
      where('date', '==', date)
    );
    
    const unsubscribe = onSnapshot(
      bookingsQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const bookings = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: timestampToDateString(data.date)
          } as Booking;
        });
        callback(bookings);
      },
      (error) => {
        console.error('Error subscribing to bookings by date:', error);
      }
    );
    return unsubscribe;
  },

  // ============ AUTH HELPERS (using Firestore, not Firebase Auth) ============
  
  login: async (email: string, password: string): Promise<User | null> => {
    try {
      const user = await FirebaseStorageService.findUserByEmail(email);
      if (user && user.password === password) {
        // Store current user in localStorage for session management
        localStorage.setItem('stv_current_user', JSON.stringify(user));
        return user;
      }
      return null;
    } catch (error) {
      console.error('Error logging in:', error);
      return null;
    }
  },

  logout: (): void => {
    localStorage.removeItem('stv_current_user');
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem('stv_current_user');
    return data ? JSON.parse(data) : null;
  }
};

