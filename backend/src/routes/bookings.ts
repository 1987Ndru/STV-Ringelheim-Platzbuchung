import express, { Response } from 'express';
import { getDatabase } from '../db/connection.js';
import { Booking, AuthRequest } from '../types.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all bookings (optionally filtered by date)
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { date } = req.query;
    const db = getDatabase();
    const bookingsCollection = db.collection<Booking>('bookings');

    const query: any = {};
    if (date) {
      query.date = date;
    }

    const bookings = await bookingsCollection.find(query).toArray();

    const bookingsWithId = bookings.map(booking => ({
      ...booking,
      id: booking._id!.toString()
    }));

    res.json(bookingsWithId);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get bookings by date
router.get('/date/:date', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { date } = req.params;
    const db = getDatabase();
    const bookingsCollection = db.collection<Booking>('bookings');

    const bookings = await bookingsCollection.find({ date }).toArray();

    const bookingsWithId = bookings.map(booking => ({
      ...booking,
      id: booking._id!.toString()
    }));

    res.json(bookingsWithId);
  } catch (error) {
    console.error('Error fetching bookings by date:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Create booking
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const bookingData: Booking = {
      ...req.body,
      userId: req.user._id!.toString(),
      userName: req.user.fullName,
      timestamp: Date.now(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const db = getDatabase();
    const bookingsCollection = db.collection<Booking>('bookings');

    // Check for conflicts
    const existing = await bookingsCollection.findOne({
      courtId: bookingData.courtId,
      date: bookingData.date,
      hour: bookingData.hour
    });

    if (existing) {
      return res.status(409).json({ error: 'Time slot already booked' });
    }

    const result = await bookingsCollection.insertOne(bookingData);
    const newBooking = {
      ...bookingData,
      id: result.insertedId.toString()
    };

    res.status(201).json(newBooking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Update booking
router.put('/:bookingId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { bookingId } = req.params;
    const db = getDatabase();
    const bookingsCollection = db.collection<Booking>('bookings');

    // Check if booking exists and user owns it or is admin
    const existing = await bookingsCollection.findOne({ _id: bookingId });
    if (!existing) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (existing.userId !== req.user._id!.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to update this booking' });
    }

    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };

    const result = await bookingsCollection.updateOne(
      { _id: bookingId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const updated = await bookingsCollection.findOne({ _id: bookingId });
    res.json({
      ...updated,
      id: updated!._id!.toString()
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// Delete booking
router.delete('/:bookingId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { bookingId } = req.params;
    const db = getDatabase();
    const bookingsCollection = db.collection<Booking>('bookings');

    // Check if booking exists and user owns it or is admin
    const existing = await bookingsCollection.findOne({ _id: bookingId });
    if (!existing) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (existing.userId !== req.user._id!.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to delete this booking' });
    }

    await bookingsCollection.deleteOne({ _id: bookingId });
    res.json({ message: 'Booking deleted' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

export default router;

