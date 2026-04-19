import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

export interface StudentRequest extends Request {
  studentAccount?: {
    id: string;
    email: string;
    name: string;
  };
}

@Injectable()
export class StudentAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<StudentRequest>();
    const header = request.headers?.authorization || '';

    const [scheme, token] = header.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException();
    }

    let payload: { sub?: string; role?: string };
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException();
    }

    if (payload.role !== 'student' || !payload.sub) {
      throw new UnauthorizedException();
    }

    const account = await this.prisma.studentAccount.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, status: true },
    });

    if (!account || account.status === 'PAUSED') {
      throw new UnauthorizedException();
    }

    request.studentAccount = {
      id: account.id,
      email: account.email,
      name: account.name,
    };

    return true;
  }
}
