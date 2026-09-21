import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/permissions.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const userId = request.session?.userId;
    if (!userId) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
        division: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Session invalid',
      });
    }

    if (user.status === 'SUSPENDED' || user.status === 'INACTIVE') {
      throw new ForbiddenException({
        code: 'ACCOUNT_DISABLED',
        message: `Account is ${user.status.toLowerCase()}`,
      });
    }

    const path = request.route?.path || request.url;
    if (
      user.mustChangePassword &&
      !path.includes('change-password') &&
      !path.includes('logout') &&
      !path.includes('users/me')
    ) {
      throw new ForbiddenException({
        code: 'MUST_CHANGE_PASSWORD',
        message: 'Password change required before continuing',
      });
    }

    request.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roleId: user.roleId,
      roleCode: user.role.code,
      roleName: user.role.name,
      divisionId: user.divisionId,
      divisionCode: user.division?.code ?? null,
      divisionName: user.division?.name ?? null,
      status: user.status,
      authProvider: user.authProvider,
      mustChangePassword: user.mustChangePassword,
      permissions: user.role.permissions.map((rp) => rp.permission.code),
    };

    return true;
  }
}
