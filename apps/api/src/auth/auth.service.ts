import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private config: ConfigService,
  ) {}

  async loginLocal(identifier: string, password: string) {
    const settings = await this.prisma.systemSettings.findUnique({
      where: { id: 'default' },
    });
    if (settings && !settings.localAuthEnabled) {
      throw new ForbiddenException({
        code: 'LOCAL_AUTH_DISABLED',
        message: 'Local authentication is disabled',
      });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanIdentifier },
          { username: cleanIdentifier },
        ],
      },
      include: { role: true, division: true },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    if (user.status === 'SUSPENDED' || user.status === 'INACTIVE') {
      throw new ForbiddenException({
        code: 'ACCOUNT_DISABLED',
        message: `Account is ${user.status.toLowerCase()}`,
      });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), status: user.status === 'PENDING' ? 'ACTIVE' : user.status },
    });

    await this.audit.log({
      actorId: user.id,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user.id,
    });

    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException({
        code: 'WEAK_PASSWORD',
        message: 'Password must be at least 8 characters',
      });
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.passwordHash) {
      throw new BadRequestException({
        code: 'NO_LOCAL_PASSWORD',
        message: 'Local password not configured for this account',
      });
    }

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Current password is incorrect',
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: false },
    });

    await this.audit.log({
      actorId: userId,
      action: 'PASSWORD_CHANGED',
      entityType: 'User',
      entityId: userId,
    });

    return { success: true };
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (user) {
      await this.audit.log({
        actorId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        entityType: 'User',
        entityId: user.id,
        newValue: { email: user.email },
      });
    }
    return { success: true, message: 'Password reset request recorded.' };
  }

  isGoogleEnabled() {
    return this.config.get('GOOGLE_OIDC_ENABLED') === 'true';
  }

  getGoogleAuthInfo() {
    return {
      enabled: this.isGoogleEnabled(),
      domain: this.config.get('ALLOWED_EMAIL_DOMAIN', 'cakrawala.ac.id'),
      message: this.isGoogleEnabled()
        ? 'Sign in with your Cakrawala Google account'
        : 'Google OIDC is not configured. Use a local demo account.',
    };
  }
}
