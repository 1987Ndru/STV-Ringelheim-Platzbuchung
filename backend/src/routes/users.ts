import express, { Response } from 'express';
import { getDatabase } from '../db/connection.js';
import { User, UserRole, AccountStatus, AuthRequest } from '../types.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all users (Admin only)
router.get('/', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const usersCollection = db.collection<User>('users');
    const users = await usersCollection.find({}).toArray();

    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return {
        ...userWithoutPassword,
        id: user._id!.toString()
      };
    });

    res.json(usersWithoutPasswords);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user status (Admin only)
router.patch('/:userId/status', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!Object.values(AccountStatus).includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const db = getDatabase();
    const usersCollection = db.collection<User>('users');

    const result = await usersCollection.updateOne(
      { _id: userId },
      { 
        $set: { 
          status: status as AccountStatus,
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User status updated' });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Update user role (Admin only)
router.patch('/:userId/role', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!Object.values(UserRole).includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Prevent admin from changing their own role
    if (req.user && req.user._id?.toString() === userId && role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Cannot change your own role' });
    }

    const db = getDatabase();
    const usersCollection = db.collection<User>('users');

    const result = await usersCollection.updateOne(
      { _id: userId },
      { 
        $set: { 
          role: role as UserRole,
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User role updated' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Delete user (Admin only)
router.delete('/:userId', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (req.user && req.user._id?.toString() === userId) {
      return res.status(403).json({ error: 'Cannot delete your own account' });
    }

    const db = getDatabase();
    const usersCollection = db.collection<User>('users');
    const bookingsCollection = db.collection('bookings');

    // Delete user
    const userResult = await usersCollection.deleteOne({ _id: userId });

    if (userResult.deletedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete all bookings from this user
    await bookingsCollection.deleteMany({ userId });

    res.json({ message: 'User and associated bookings deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;

