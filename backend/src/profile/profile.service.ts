import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        whatsapp: true,
        slug: true,
        timezone: true,
        subjects: true,
        aboutText: true,
        avatarUrl: true,
        taxStatus: true,
        lessonsCount: true,
        rating: true,
        createdAt: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getStats(userId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const [studentsCount, lessonsThisMonth, avgRate] = await Promise.all([
      this.prisma.student.count({
        where: { userId, status: 'ACTIVE' },
      }),
      this.prisma.lesson.count({
        where: {
          userId,
          scheduledAt: { gte: monthStart, lte: monthEnd },
          status: 'COMPLETED',
        },
      }),
      this.prisma.lesson.aggregate({
        where: { userId, status: 'COMPLETED' },
        _avg: { rate: true },
      }),
    ]);

    return {
      studentsCount,
      lessonsThisMonth,
      avgRate: avgRate._avg.rate || 0,
      memberSince: user.createdAt,
    };
  }
}
