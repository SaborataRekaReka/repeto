import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePackageDto, UpdatePackageDto } from './dto';

@Injectable()
export class PackagesService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    userId: string,
    query: {
      studentId?: string;
      status?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PackageWhereInput = { userId };
    if (query.studentId) where.studentId = query.studentId;
    if (query.status) where.status = query.status as any;

    const [data, total] = await Promise.all([
      this.prisma.package.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          student: { select: { id: true, name: true } },
        },
      }),
      this.prisma.package.count({ where }),
    ]);

    return { data, total, page, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string, userId: string) {
    const pkg = await this.prisma.package.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, name: true } },
        payments: true,
      },
    });

    if (!pkg) throw new NotFoundException('Package not found');
    if (pkg.userId !== userId) throw new ForbiddenException();

    return pkg;
  }

  async create(userId: string, dto: CreatePackageDto) {
    return this.prisma.package.create({
      data: {
        ...dto,
        userId,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
      },
      include: { student: { select: { id: true, name: true } } },
    });
  }

  async update(id: string, userId: string, dto: UpdatePackageDto) {
    const pkg = await this.prisma.package.findUnique({ where: { id } });
    if (!pkg) throw new NotFoundException('Package not found');
    if (pkg.userId !== userId) throw new ForbiddenException();

    const data: any = { ...dto };
    if (Object.prototype.hasOwnProperty.call(dto, 'validUntil')) {
      data.validUntil = dto.validUntil ? new Date(dto.validUntil) : null;
    }
    if (Object.prototype.hasOwnProperty.call(dto, 'comment')) {
      data.comment = dto.comment || null;
    }

    return this.prisma.package.update({ where: { id }, data });
  }

  async remove(id: string, userId: string) {
    const pkg = await this.prisma.package.findUnique({ where: { id } });
    if (!pkg) throw new NotFoundException('Package not found');
    if (pkg.userId !== userId) throw new ForbiddenException();

    return this.prisma.package.delete({ where: { id } });
  }
}
