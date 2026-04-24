import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { isAdminEmail } from '../common/utils/admin-access';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: { email?: string; role?: string };
    }>();
    const user = request.user;

    if (user?.role === 'admin' || isAdminEmail(user?.email)) {
      return true;
    }

    throw new ForbiddenException('Недостаточно прав для доступа к админке');
  }
}
