/**
 * One Bite Restaurant Operating Hours Validation System
 * 
 * Operating Hours:
 * - Opening Time: 11:00 AM IST (11:00:00)
 * - Closing Time: 8:45 PM IST (20:45:00)
 * - Timezone: "Asia/Kolkata" (Indian Standard Time, UTC + 05:30)
 * 
 * Rules:
 * - Before 11:00 AM IST: CLOSED (Orders Blocked)
 * - 11:00 AM to 8:44:59 PM IST: OPEN (Orders Allowed)
 * - 8:45 PM IST and after: CLOSED (Orders Blocked)
 */

export const RESTAURANT_TIMEZONE = 'Asia/Kolkata';

// 11:00 AM = 11 * 60 = 660 minutes from midnight IST
export const OPEN_MINUTES_IST = 11 * 60; // 660

// 8:45 PM = (12 + 8) * 60 + 45 = 20 * 60 + 45 = 1245 minutes from midnight IST
export const CLOSE_MINUTES_IST = 20 * 60 + 45; // 1245

export const RESTAURANT_SCHEDULE_TEXT = '11:00 AM to 8:45 PM IST';
export const RESTAURANT_CLOSED_TITLE = 'Restaurant Currently Closed';
export const RESTAURANT_CLOSED_MESSAGE =
  "We’re sorry! One Bite is currently closed and cannot accept your order right now. Our operating hours are 11:00 AM to 8:45 PM IST. Please visit us again during our opening hours.";

export const STATUS_OPEN_LABEL = 'OPEN NOW — Accepting Orders';
export const STATUS_CLOSED_LABEL = 'CLOSED — Orders Unavailable';

export interface IstTimeBreakdown {
  hours: number; // 0-23 in IST
  minutes: number; // 0-59 in IST
  seconds: number; // 0-59 in IST
  totalMinutes: number; // hours * 60 + minutes
  formattedTime: string; // e.g. "11:30 AM"
  formattedDate: string; // e.g. "Wednesday, 21 Oct 2026"
}

/**
 * Extracts accurate time components in Indian Standard Time (Asia/Kolkata)
 * independent of the user device's local timezone.
 */
export function getIstTime(date: Date = new Date()): IstTimeBreakdown {
  try {
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: RESTAURANT_TIMEZONE,
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });

    const parts = timeFormatter.format(date).split(':');
    const hours = parseInt(parts[0], 10) % 24;
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2] || '0', 10);
    const totalMinutes = hours * 60 + minutes;

    const displayFormatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: RESTAURANT_TIMEZONE,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const dateFormatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: RESTAURANT_TIMEZONE,
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return {
      hours,
      minutes,
      seconds,
      totalMinutes,
      formattedTime: displayFormatter.format(date),
      formattedDate: dateFormatter.format(date),
    };
  } catch (err) {
    // High-precision mathematical fallback for UTC -> IST (+5 hours 30 mins)
    const utcMs = date.getTime();
    const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
    const istDate = new Date(utcMs + istOffsetMs);

    const hours = istDate.getUTCHours();
    const minutes = istDate.getUTCMinutes();
    const seconds = istDate.getUTCSeconds();
    const totalMinutes = hours * 60 + minutes;

    const hour12 = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;

    return {
      hours,
      minutes,
      seconds,
      totalMinutes,
      formattedTime: `${hour12}:${formattedMinutes} ${ampm}`,
      formattedDate: istDate.toUTCString().slice(0, 16),
    };
  }
}

/**
 * Validates if the restaurant is currently within operating hours.
 * 
 * - From 11:00 AM (660 mins) until 8:44:59 PM (1244 mins): Returns TRUE.
 * - At 8:45 PM (1245 mins) and after, or before 11:00 AM (660 mins): Returns FALSE.
 */
export function isRestaurantOpen(date: Date = new Date()): boolean {
  const { totalMinutes } = getIstTime(date);
  return totalMinutes >= OPEN_MINUTES_IST && totalMinutes < CLOSE_MINUTES_IST;
}

export interface RestaurantLiveStatus {
  isOpen: boolean;
  statusText: string; // "OPEN NOW — Accepting Orders" vs "CLOSED — Orders Unavailable"
  shortBadgeText: string; // "Open Now" vs "Closed"
  todayScheduleText: string; // "11:00 AM – 8:45 PM IST"
  currentIstTime: string;
  reopenMessage: string;
}

/**
 * Returns complete status descriptor for badges, headers, and banners
 */
export function getLiveOperatingStatus(date: Date = new Date()): RestaurantLiveStatus {
  const ist = getIstTime(date);
  const isOpen = ist.totalMinutes >= OPEN_MINUTES_IST && ist.totalMinutes < CLOSE_MINUTES_IST;

  let reopenMessage = '';
  if (!isOpen) {
    if (ist.totalMinutes < OPEN_MINUTES_IST) {
      reopenMessage = 'Opens today at 11:00 AM IST';
    } else {
      reopenMessage = 'Closed for the night. Opens tomorrow at 11:00 AM IST';
    }
  } else {
    reopenMessage = 'Accepting orders until 8:45 PM IST';
  }

  return {
    isOpen,
    statusText: isOpen ? STATUS_OPEN_LABEL : STATUS_CLOSED_LABEL,
    shortBadgeText: isOpen ? 'Open Now' : 'Closed',
    todayScheduleText: '11:00 AM – 8:45 PM IST',
    currentIstTime: ist.formattedTime,
    reopenMessage,
  };
}
