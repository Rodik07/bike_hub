export const SLOT_INTERVAL_MINUTES = 15;
export const BOOKING_DAY_START_MINUTES = 9 * 60;
export const BOOKING_DAY_END_MINUTES = 17 * 60;

export const ACTIVE_BOOKING_STATUSES = ['pending', 'approved', 'rescheduled'];

export function generateBookingSlots() {
  const slots = [];
  for (let minutes = BOOKING_DAY_START_MINUTES; minutes < BOOKING_DAY_END_MINUTES; minutes += SLOT_INTERVAL_MINUTES) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
  return slots;
}

export function normalizeTime(time) {
  if (!time || typeof time !== 'string') return null;
  const trimmed = time.trim();
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const h = Number(match24[1]);
    const m = Number(match24[2]);
    if (h < 0 || h > 23 || m < 0 || m > 59 || m % SLOT_INTERVAL_MINUTES !== 0) return null;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    let h = Number(match12[1]);
    const m = Number(match12[2]);
    const period = match12[3].toUpperCase();
    if (h < 1 || h > 12 || m < 0 || m > 59 || m % SLOT_INTERVAL_MINUTES !== 0) return null;
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  return null;
}

export function isValidBookingSlot(time) {
  const normalized = normalizeTime(time);
  if (!normalized) return false;
  return generateBookingSlots().includes(normalized);
}

export function toDateKey(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

export function getEffectiveSlot(booking) {
  if (booking.status === 'rescheduled' && booking.rescheduledDate && booking.rescheduledTime) {
    return {
      dateKey: toDateKey(booking.rescheduledDate),
      time: normalizeTime(booking.rescheduledTime)
    };
  }
  return {
    dateKey: toDateKey(booking.bookingDate),
    time: normalizeTime(booking.preferredTime)
  };
}

export async function findConflictingBooking(Booking, dealerId, bookingDate, preferredTime, excludeBookingId = null) {
  const dateKey = toDateKey(bookingDate);
  const time = normalizeTime(preferredTime);
  if (!dateKey || !time) return null;

  const filter = {
    dealer: dealerId,
    status: { $in: ACTIVE_BOOKING_STATUSES }
  };
  if (excludeBookingId) {
    filter._id = { $ne: excludeBookingId };
  }

  const bookings = await Booking.find(filter).select('bookingDate preferredTime rescheduledDate rescheduledTime status');

  return bookings.find((booking) => {
    const slot = getEffectiveSlot(booking);
    return slot.dateKey === dateKey && slot.time === time;
  }) || null;
}

export async function getBookedSlotsForDate(Booking, dealerId, bookingDate, excludeBookingId = null) {
  const dateKey = toDateKey(bookingDate);
  if (!dateKey) return [];

  const filter = {
    dealer: dealerId,
    status: { $in: ACTIVE_BOOKING_STATUSES }
  };
  if (excludeBookingId) {
    filter._id = { $ne: excludeBookingId };
  }

  const bookings = await Booking.find(filter).select('bookingDate preferredTime rescheduledDate rescheduledTime status');

  const booked = new Set();
  for (const booking of bookings) {
    const slot = getEffectiveSlot(booking);
    if (slot.dateKey === dateKey && slot.time) {
      booked.add(slot.time);
    }
  }
  return [...booked];
}
