import {
  Injectable,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../common/decorators';
import { isAdminEmail } from '../../common/utils/admin-access';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(
    err: any,
    user: TUser,
    _info: any,
    context: ExecutionContext,
    _status?: any,
  ): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }

    const request = context.switchToHttp().getRequest<{ path?: string; url?: string }>();
    const path = (request.path || request.url || '').toLowerCase();
    const authUser = user as {
      platformAccessState?: string;
      role?: string;
      email?: string;
    };
    const shouldBypassPlatformAccessCheck =
      path.startsWith('/api/auth') ||
      path.startsWith('/auth') ||
      path.startsWith('/api/admin') ||
      path.startsWith('/admin') ||
      authUser.role === 'admin' ||
      isAdminEmail(authUser.email);

    if (!shouldBypassPlatformAccessCheck && authUser.platformAccessState === 'expired') {
      throw new ForbiddenException('Доступ к платформе закрыт. Нажмите «Продлить».');
    }

    return user;
  }
}
