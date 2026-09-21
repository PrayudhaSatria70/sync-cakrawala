import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
        division: true,
      },
    });
    if (!user) throw new NotFoundException({ code: 'NOT_FOUND', message: 'User not found' });

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
      status: user.status,
      authProvider: user.authProvider,
      mustChangePassword: user.mustChangePassword,
      lastLoginAt: user.lastLoginAt,
      timezone: user.timezone,
      theme: user.theme,
      density: user.density,
      language: user.language,
      notifyApprovals: user.notifyApprovals,
      notifyConflicts: user.notifyConflicts,
      notifyReviews: user.notifyReviews,
      notifyTasks: user.notifyTasks,
      role: {
        id: user.role.id,
        code: user.role.code,
        name: user.role.name,
      },
      division: user.division
        ? { id: user.division.id, code: user.division.code, name: user.division.name }
        : null,
      permissions: user.role.permissions.map((rp) => rp.permission.code),
    };
  }

  async updateProfile(
    userId: string,
    data: {
      fullName?: string;
      timezone?: string;
      theme?: string;
      density?: string;
      language?: string;
      notifyApprovals?: boolean;
      notifyConflicts?: boolean;
      notifyReviews?: boolean;
      notifyTasks?: boolean;
    },
  ) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: data.fullName,
        timezone: data.timezone,
        theme: data.theme,
        density: data.density,
        language: data.language,
        notifyApprovals: data.notifyApprovals,
        notifyConflicts: data.notifyConflicts,
        notifyReviews: data.notifyReviews,
        notifyTasks: data.notifyTasks,
      },
    });
    return this.getMe(userId);
  }
}
