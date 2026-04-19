import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePackageDto, UpdatePackageDto } from './dto';

@Injectable()
export class PackagesService {
  constructor(private prisma: PrismaService) {}

  private async ensureStudentBelongsToUser(userId: string, studentId: string) {
    const student = await this.prisma.student.findFirst({
      where: {
        id: studentId,
        userId,
      },
      select: { id: true },
    });

    if (!student) {
      throw new BadRequestException('Ученик не найден');
    }
  }

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
    const isPublic = !!dto.isPublic;
    const studentId = isPublic ? null : dto.studentId || null;

    if (!isPublic && !studentId) {
      throw new BadRequestException('Для личного пакета выберите ученика');
    }

    if (studentId) {
      await this.ensureStudentBelongsToUser(userId, studentId);
    }

    return this.prisma.package.create({
      data: {
        userId,
        studentId,
        isPublic,
        subject: dto.subject,
        lessonsTotal: dto.lessonsTotal,
        totalPrice: dto.totalPrice,
        comment: dto.comment?.trim() || null,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
      },
      include: { student: { select: { id: true, name: true } } },
    });
  }

  async update(id: string, userId: string, dto: UpdatePackageDto) {
    const pkg = await this.prisma.package.findUnique({ where: { id } });
    if (!pkg) throw new NotFoundException('Package not found');
    if (pkg.userId !== userId) throw new ForbiddenException();

    const data: Prisma.PackageUpdateInput = {};

    if (Object.prototype.hasOwnProperty.call(dto, 'subject')) {
      data.subject = dto.subject;
    }
    if (Object.prototype.hasOwnProperty.call(dto, 'lessonsTotal')) {
      data.lessonsTotal = dto.lessonsTotal;
    }
    if (Object.prototype.hasOwnProperty.call(dto, 'totalPrice')) {
      data.totalPrice = dto.totalPrice;
    }

    const hasIsPublicInPayload = Object.prototype.hasOwnProperty.call(dto, 'isPublic');
    const hasStudentInPayload = Object.prototype.hasOwnProperty.call(dto, 'studentId');
    const nextIsPublic = hasIsPublicInPayload ? !!dto.isPublic : pkg.isPublic;

    if (hasIsPublicInPayload) {
      data.isPublic = nextIsPublic;
    }

    if (nextIsPublic) {
      // Public package is tariff-like and must not be attached to a student.
      data.student = { disconnect: true };
    } else {
      const nextStudentId = hasStudentInPayload ? dto.studentId || null : pkg.studentId;

      if (!nextStudentId) {
        throw new BadRequestException('Для личного пакета выберите ученика');
      }

      if (hasStudentInPayload && dto.studentId) {
        await this.ensureStudentBelongsToUser(userId, dto.studentId);
        data.student = { connect: { id: dto.studentId } };
      }
    }

    if (Object.prototype.hasOwnProperty.call(dto, 'validUntil')) {
      data.validUntil = dto.validUntil ? new Date(dto.validUntil) : null;
    }
    if (Object.prototype.hasOwnProperty.call(dto, 'comment')) {
      data.comment = dto.comment?.trim() || null;
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
