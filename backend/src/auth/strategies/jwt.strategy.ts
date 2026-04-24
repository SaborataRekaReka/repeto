import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import {
  getPlatformAccessState,
  normalizePlatformAccess,
} from '../../common/utils/platform-access';
import { resolveUserRole } from '../../common/utils/admin-access';
import { AppConfigService } from '../../config/app-config.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prisma: PrismaService,
    cfg: AppConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: cfg.jwtSecret,
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
