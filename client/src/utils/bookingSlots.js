export const SLOT_INTERVAL_MINUTES = 15;

export function generateBookingSlots() {
  const slots = [];
  for (let minutes = 9 * 60; minutes < 17 * 60; minutes += SLOT_INTERVAL_MINUTES) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
  return slots;
}

export function formatSlotLabel(time24) {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

export function normalizeTimeTo24(time) {
  if (!time) return '';
  if (/^\d{2}:\d{2}$/.test(time)) return time;
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return time;
  let h = Number(match[1]);
  const m = match[2];
  const period = match[3].toUpperCase();
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m}`;
}

export function displayBookingTime(time) {
  if (!time) return '';
  if (/^\d{2}:\d{2}$/.test(time)) return formatSlotLabel(time);
  return time;
}
