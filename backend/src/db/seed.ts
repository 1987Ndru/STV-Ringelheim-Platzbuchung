import { getDatabase } from './connection.js';
import { User, UserRole, AccountStatus } from '../types.js';
import bcrypt from 'bcryptjs';

export async function seedDatabase() {
  const db = getDatabase();
  const usersCollection = db.collection('users');
  const bookingsCollection = db.collection('bookings');

  // Check if admin user exists
  const adminExists = await usersCollection.findOne({ email: 'admin@stv.de' });
  
  if (!adminExists) {
    console.log('🌱 Seeding initial data...');
    
    const hashedPassword = await bcrypt.hash('admin', 10);
    
    const admin: User = {
      email: 'admin@stv.de',
      firstName: 'Vorstand',
      lastName: 'Admin',
      fullName: 'Vorstand (Admin)',
      role: UserRole.ADMIN,
      status: AccountStatus.APPROVED,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const trainer: User = {
      email: 'trainer@stv.de',
      firstName: 'Coach',
      lastName: 'Esume',
      fullName: 'Coach Esume',
      role: UserRole.TRAINER,
      status: AccountStatus.APPROVED,
      password: await bcrypt.hash('coach', 10),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const demoUser: User = {
      email: 'demo@stv.de',
      firstName: 'Max',
      lastName: 'Mustermann',
      fullName: 'Max Mustermann',
      role: UserRole.MEMBER,
      status: AccountStatus.APPROVED,
      password: await bcrypt.hash('demo', 10),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await usersCollection.insertMany([admin, trainer, demoUser]);
    console.log('✅ Initial users created');
  }

  // Ensure bookings collection exists (empty)
  const bookingsCount = await bookingsCollection.countDocuments();
  if (bookingsCount === 0) {
    console.log('✅ Bookings collection ready');
  }
}

