import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import {
  getPlatformAccessState,
  normalizePlatformAccess,
} from '../../common/utils/platform-access';
import { resolveUserRole } from '../../common/utils/admin-access';

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('JWT_SECRET is required for JWT strategy');
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: { sub: string; role?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        paymentSettings: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    const role = payload.role || resolveUserRole(user.email);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role,
      platformAccess: normalizePlatformAccess(user.paymentSettings),
      platformAccessState: getPlatformAccessState(user.paymentSettings),
    };
  }
}
