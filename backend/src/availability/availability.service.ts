import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AvailabilitySlotDto, OverrideSlotDto } from './dto';

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  /** Get all weekly recurring slots for a tutor. */
  async getWeeklySlots(userId: string) {
    const slots = await this.prisma.tutorAvailability.findMany({
      where: { userId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
    return slots.map((s) => ({
      id: s.id,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
    }));
  }

  /**
   * Replace all weekly slots for a tutor (idempotent PUT).
   * Deletes everything then inserts fresh — simple and avoids diff logic.
   */
  async setWeeklySlots(userId: string, slots: AvailabilitySlotDto[]) {
    await this.prisma.$transaction([
      this.prisma.tutorAvailability.deleteMany({ where: { userId } }),
      this.prisma.tutorAvailability.createMany({
        data: slots.map((s) => ({
          userId,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
      }),
    ]);
    return this.getWeeklySlots(userId);
  }

  // ── Overrides (date-specific) ──

  /** List all overrides for a tutor, sorted by date. */
  async getOverrides(userId: string) {
    const rows = await this.prisma.availabilityOverride.findMany({
      where: { userId },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
    // Group by date
    const map = new Map<string, { isBlocked: boolean; slots: { startTime: string; endTime: string }[] }>();
    for (const r of rows) {
      const dateStr = new Date(r.date).toISOString().split('T')[0];
      if (!map.has(dateStr)) map.set(dateStr, { isBlocked: r.isBlocked, slots: [] });
      const entry = map.get(dateStr)!;
      if (r.isBlocked) {
        entry.isBlocked = true;
      } else {
        entry.slots.push({ startTime: r.startTime, endTime: r.endTime });
      }
    }
    return Array.from(map.entries()).map(([date, v]) => ({
      date,
      isBlocked: v.isBlocked,
      slots: v.isBlocked ? [] : v.slots,
    }));
  }

  /** Set override for a specific date: either block it or set custom slots. */
  async setOverrideForDate(userId: string, date: string, isBlocked: boolean, slots?: OverrideSlotDto[]) {
    const dateObj = new Date(date + 'T00:00:00Z');

    // Delete existing overrides for this date
    await this.prisma.availabilityOverride.deleteMany({
      where: { userId, date: dateObj },
    });

    if (isBlocked) {
      // Create a single "blocked" marker
      await this.prisma.availabilityOverride.create({
        data: { userId, date: dateObj, startTime: '00:00', endTime: '00:00', isBlocked: true },
      });
    } else if (slots && slots.length > 0) {
      // Create custom time slots
      await this.prisma.availabilityOverride.createMany({
        data: slots.map((s) => ({
          userId,
          date: dateObj,
          startTime: s.startTime,
          endTime: s.endTime,
          isBlocked: false,
        })),
      });
    }

    return this.getOverrides(userId);
  }

  /** Remove override for a specific date (reverts to weekly template). */
  async deleteOverrideForDate(userId: string, date: string) {
    const dateObj = new Date(date + 'T00:00:00Z');
    await this.prisma.availabilityOverride.deleteMany({
      where: { userId, date: dateObj },
    });
    return this.getOverrides(userId);
  }

  /**
   * Compute free slots for a date range.
   * 1. Get recurring weekly rules
   * 2. Expand them into concrete dates in the range
   * 3. Apply overrides (blocked dates remove slots, custom dates replace slots)
   * 4. Subtract existing (PLANNED) lessons
   * 5. Return available slots
   */
  async getFreeSlots(
    userId: string,
    from: Date,
    to: Date,
    durationMinutes = 30,
  ) {
    // 1. Weekly rules
    const rules = await this.prisma.tutorAvailability.findMany({
      where: { userId },
    });

    // 1b. Overrides in range
    const overrides = await this.prisma.availabilityOverride.findMany({
      where: { userId, date: { gte: from, lte: to } },
    });

    // Group overrides by date
    const overrideMap = new Map<string, typeof overrides>();
    for (const ov of overrides) {
      const dateStr = new Date(ov.date).toISOString().split('T')[0];
      if (!overrideMap.has(dateStr)) overrideMap.set(dateStr, []);
      overrideMap.get(dateStr)!.push(ov);
    }

    // 2. Expand rules into concrete date+time pairs, applying overrides
    const expanded: { date: string; startTime: string; endTime: string }[] = [];
    const current = new Date(from);
    current.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(to);
    endDate.setUTCHours(23, 59, 59, 999);

    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const dateOverrides = overrideMap.get(dateStr);

      if (dateOverrides && dateOverrides.length > 0) {
        // Check if this date is fully blocked
        const blocked = dateOverrides.some((o) => o.isBlocked);
        if (!blocked) {
          // Use override slots instead of weekly rules
          for (const ov of dateOverrides) {
            expanded.push({
              date: dateStr,
              startTime: ov.startTime,
              endTime: ov.endTime,
            });
          }
        }
        // If blocked: no slots for this date (skip)
      } else {
        // No override — use weekly rules
        const jsDay = current.getUTCDay();
        const ourDay = jsDay === 0 ? 6 : jsDay - 1;
        for (const rule of rules) {
          if (rule.dayOfWeek === ourDay) {
            expanded.push({
              date: dateStr,
              startTime: rule.startTime,
              endTime: rule.endTime,
            });
          }
        }
      }

      current.setDate(current.getDate() + 1);
    }

    // 3. Get occupied lessons in range
    const lessons = await this.prisma.lesson.findMany({
      where: {
        userId,
        scheduledAt: { gte: from, lte: to },
        status: { in: ['PLANNED', 'COMPLETED'] },
      },
      select: { scheduledAt: true, duration: true },
    });

    // Build a set of occupied slot keys "YYYY-MM-DD|HH:MM"
    const occupied = new Set<string>();
    for (const lesson of lessons) {
      const d = new Date(lesson.scheduledAt);
      const dateStr = d.toISOString().split('T')[0];
      const startMin = d.getUTCHours() * 60 + d.getUTCMinutes();
      // Mark all 30-min blocks that this lesson covers as busy
      for (let m = startMin; m < startMin + lesson.duration; m += 30) {
        const hh = String(Math.floor(m / 60)).padStart(2, '0');
        const mm = String(m % 60).padStart(2, '0');
        occupied.add(`${dateStr}|${hh}:${mm}`);
      }
    }

    // 4. Also get booking requests that are PENDING/CONFIRMED
    const bookings = await this.prisma.bookingRequest.findMany({
      where: {
        userId,
        date: { gte: from, lte: to },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      select: { date: true, startTime: true, duration: true },
    });
    for (const b of bookings) {
      const dateStr = new Date(b.date).toISOString().split('T')[0];
      const [hh, mm] = b.startTime.split(':').map(Number);
      const startMin = hh * 60 + mm;
      for (let m = startMin; m < startMin + b.duration; m += 30) {
        const h = String(Math.floor(m / 60)).padStart(2, '0');
        const mi = String(m % 60).padStart(2, '0');
        occupied.add(`${dateStr}|${h}:${mi}`);
      }
    }

    // 5. Filter: only include future slots that are not occupied
    const now = new Date();
    const free = expanded.filter((slot) => {
      const slotDateTime = new Date(`${slot.date}T${slot.startTime}:00`);
      if (slotDateTime <= now) return false;
      const key = `${slot.date}|${slot.startTime}`;
      return !occupied.has(key);
    });

    return free.map((s) => ({
      date: s.date,
      time: s.startTime,
      duration: durationMinutes,
    }));
  }
}
