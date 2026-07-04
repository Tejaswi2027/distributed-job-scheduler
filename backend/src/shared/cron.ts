/**
 * A simple cron helper to calculate the next run time for basic cron expressions.
 * Supports standard expressions like:
 * - * * * * * (every minute)
 * - *\/N * * * * (every N minutes)
 * - N * * * * (at minute N of every hour)
 * - H M * * * (at H:M every day)
 */
export function calculateNextRun(cron: string, baseDate = new Date()): Date {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) {
    // Fallback to 1 minute later if cron is malformed
    const fallback = new Date(baseDate);
    fallback.setMinutes(fallback.getMinutes() + 1);
    return fallback;
  }

  const [minStr, hourStr, domStr, monthStr, dowStr] = parts;
  const next = new Date(baseDate);
  next.setSeconds(0);
  next.setMilliseconds(0);

  // If every minute
  if (minStr === '*' && hourStr === '*' && domStr === '*' && monthStr === '*' && dowStr === '*') {
    next.setMinutes(next.getMinutes() + 1);
    return next;
  }

  // Handle minute intervals (e.g. */5 * * * *)
  if (minStr.startsWith('*/')) {
    const interval = parseInt(minStr.substring(2), 10);
    if (!isNaN(interval) && interval > 0) {
      const currentMin = next.getMinutes();
      const diff = interval - (currentMin % interval);
      next.setMinutes(currentMin + (diff === 0 ? interval : diff));
      return next;
    }
  }

  // Handle specific minute and hour (e.g. 0 0 * * *)
  const targetMin = parseInt(minStr, 10);
  const targetHour = parseInt(hourStr, 10);

  if (!isNaN(targetMin) && hourStr === '*') {
    // e.g. "30 * * * *" (every hour at minute 30)
    if (next.getMinutes() < targetMin) {
      next.setMinutes(targetMin);
    } else {
      next.setHours(next.getHours() + 1);
      next.setMinutes(targetMin);
    }
    return next;
  }

  if (!isNaN(targetMin) && !isNaN(targetHour)) {
    // e.g. "0 12 * * *" (every day at 12:00)
    next.setHours(targetHour, targetMin, 0, 0);
    if (next.getTime() <= baseDate.getTime()) {
      next.setDate(next.getDate() + 1);
    }
    return next;
  }

  // General fallback: add 1 minute
  next.setMinutes(next.getMinutes() + 1);
  return next;
}
