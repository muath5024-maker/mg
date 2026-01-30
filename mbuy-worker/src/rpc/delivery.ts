/**
 * Delivery RPC Functions
 * 
 * Delivery slot booking and availability management
 */

import { sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

interface SlotBookingResult {
  success: boolean;
  booking_id?: string;
  error?: string;
  slot?: {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    remaining_capacity: number;
  };
}

/**
 * Book a delivery slot for an order
 * 
 * This function:
 * 1. Checks slot availability
 * 2. Creates a booking
 * 3. Updates slot capacity
 * 4. Returns booking confirmation
 */
export async function bookDeliverySlot(
  db: PostgresJsDatabase,
  params: {
    slotId: string;
    date: string;
    orderId: string;
    customerId?: string;
  }
): Promise<SlotBookingResult> {
  const { slotId, date, orderId, customerId } = params;

  // Use transaction for atomic operation
  return await db.transaction(async (tx) => {
    // 1. Check slot availability with lock
    const [availability] = await tx.execute<{
      id: string;
      slot_id: string;
      date: string;
      capacity: number;
      booked: number;
      is_available: boolean;
    }>(sql`
      SELECT 
        a.id,
        a.slot_id,
        a.date,
        s.capacity,
        COALESCE(a.booked_count, 0) as booked,
        a.is_available
      FROM delivery_slot_availability a
      JOIN delivery_slots s ON s.id = a.slot_id
      WHERE a.slot_id = ${slotId} AND a.date = ${date}::date
      FOR UPDATE
    `);

    if (!availability) {
      return {
        success: false,
        error: 'Slot not available for the selected date'
      };
    }

    if (!availability.is_available) {
      return {
        success: false,
        error: 'This slot is no longer available'
      };
    }

    if (availability.booked >= availability.capacity) {
      // Mark as unavailable
      await tx.execute(sql`
        UPDATE delivery_slot_availability
        SET is_available = false
        WHERE id = ${availability.id}
      `);

      return {
        success: false,
        error: 'This slot is fully booked'
      };
    }

    // 2. Check if order already has a booking
    const [existingBooking] = await tx.execute<{ id: string }>(sql`
      SELECT id FROM delivery_bookings
      WHERE order_id = ${orderId}
    `);

    if (existingBooking) {
      return {
        success: false,
        error: 'Order already has a delivery booking'
      };
    }

    // 3. Create booking
    const [booking] = await tx.execute<{ id: string }>(sql`
      INSERT INTO delivery_bookings (
        slot_availability_id,
        order_id,
        customer_id,
        status
      ) VALUES (
        ${availability.id},
        ${orderId},
        ${customerId || null},
        'confirmed'
      )
      RETURNING id
    `);

    // 4. Update availability count
    await tx.execute(sql`
      UPDATE delivery_slot_availability
      SET 
        booked_count = booked_count + 1,
        is_available = (booked_count + 1) < ${availability.capacity}
      WHERE id = ${availability.id}
    `);

    // 5. Get slot details
    const [slot] = await tx.execute<{
      id: string;
      start_time: string;
      end_time: string;
      name: string;
    }>(sql`
      SELECT id, start_time, end_time, name
      FROM delivery_slots
      WHERE id = ${slotId}
    `);

    return {
      success: true,
      booking_id: booking.id,
      slot: {
        id: slot.id,
        date: availability.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        remaining_capacity: availability.capacity - availability.booked - 1
      }
    };
  });
}

/**
 * Cancel a delivery booking
 */
export async function cancelDeliveryBooking(
  db: PostgresJsDatabase,
  params: {
    bookingId?: string;
    orderId?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const { bookingId, orderId } = params;

  if (!bookingId && !orderId) {
    return { success: false, error: 'Either bookingId or orderId is required' };
  }

  return await db.transaction(async (tx) => {
    // Find the booking
    let condition = bookingId 
      ? sql`id = ${bookingId}`
      : sql`order_id = ${orderId}`;

    const [booking] = await tx.execute<{
      id: string;
      slot_availability_id: string;
      status: string;
    }>(sql`
      SELECT id, slot_availability_id, status
      FROM delivery_bookings
      WHERE ${condition}
      FOR UPDATE
    `);

    if (!booking) {
      return { success: false, error: 'Booking not found' };
    }

    if (booking.status === 'cancelled') {
      return { success: false, error: 'Booking is already cancelled' };
    }

    // Update booking status
    await tx.execute(sql`
      UPDATE delivery_bookings
      SET status = 'cancelled', cancelled_at = NOW()
      WHERE id = ${booking.id}
    `);

    // Restore availability
    await tx.execute(sql`
      UPDATE delivery_slot_availability
      SET 
        booked_count = GREATEST(booked_count - 1, 0),
        is_available = true
      WHERE id = ${booking.slot_availability_id}
    `);

    return { success: true };
  });
}

/**
 * Get available delivery slots for a date range
 */
export async function getAvailableSlots(
  db: PostgresJsDatabase,
  params: {
    storeId: string;
    startDate: string;
    endDate: string;
    zone?: string;
  }
): Promise<Array<{
  date: string;
  slots: Array<{
    id: string;
    name: string;
    start_time: string;
    end_time: string;
    remaining: number;
    price?: number;
  }>;
}>> {
  const { storeId, startDate, endDate, zone } = params;

  const results = await db.execute<{
    date: string;
    slot_id: string;
    name: string;
    start_time: string;
    end_time: string;
    capacity: number;
    booked_count: number;
    price: number;
  }>(sql`
    SELECT 
      a.date::text,
      s.id as slot_id,
      s.name,
      s.start_time::text,
      s.end_time::text,
      s.capacity,
      COALESCE(a.booked_count, 0) as booked_count,
      s.price
    FROM delivery_slot_availability a
    JOIN delivery_slots s ON s.id = a.slot_id
    WHERE 
      s.store_id = ${storeId}
      AND a.date >= ${startDate}::date
      AND a.date <= ${endDate}::date
      AND a.is_available = true
      AND s.is_active = true
      ${zone ? sql`AND (s.zones IS NULL OR ${zone} = ANY(s.zones))` : sql``}
    ORDER BY a.date, s.start_time
  `);

  // Group by date
  const grouped = new Map<string, Array<{
    id: string;
    name: string;
    start_time: string;
    end_time: string;
    remaining: number;
    price?: number;
  }>>();

  for (const row of results as unknown as Array<typeof results[0]>) {
    const slots = grouped.get(row.date) || [];
    slots.push({
      id: row.slot_id,
      name: row.name,
      start_time: row.start_time,
      end_time: row.end_time,
      remaining: row.capacity - row.booked_count,
      price: row.price
    });
    grouped.set(row.date, slots);
  }

  return Array.from(grouped.entries()).map(([date, slots]) => ({
    date,
    slots
  }));
}

/**
 * Generate delivery slot availability for future dates
 */
export async function generateSlotAvailability(
  db: PostgresJsDatabase,
  params: {
    storeId: string;
    daysAhead?: number;
  }
): Promise<{ created: number }> {
  const { storeId, daysAhead = 14 } = params;

  // Get all active slots for the store
  const slots = await db.execute<{
    id: string;
    days_of_week: number[];
  }>(sql`
    SELECT id, days_of_week
    FROM delivery_slots
    WHERE store_id = ${storeId} AND is_active = true
  `);

  let created = 0;

  for (const slot of slots as unknown as Array<typeof slots[0]>) {
    // Generate availability for each day
    const result = await db.execute(sql`
      INSERT INTO delivery_slot_availability (slot_id, date, is_available, booked_count)
      SELECT 
        ${slot.id},
        d::date,
        true,
        0
      FROM generate_series(
        CURRENT_DATE,
        CURRENT_DATE + ${daysAhead}::integer,
        '1 day'::interval
      ) d
      WHERE 
        EXTRACT(DOW FROM d) = ANY(${slot.days_of_week}::integer[])
      ON CONFLICT (slot_id, date) DO NOTHING
    `);

    created += (result as any).rowCount || 0;
  }

  return { created };
}
