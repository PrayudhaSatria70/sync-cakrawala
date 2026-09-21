import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PERMISSIONS } from '@sync/shared';

@Injectable()
export class ConflictsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notifications: NotificationsService,
  ) {}

  async list(status?: string) {
    return this.prisma.conflict.findMany({
      where: status ? { status } : undefined,
      include: {
        owner: { select: { id: true, fullName: true } },
        resolutions: {
          include: { resolvedBy: { select: { id: true, fullName: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async get(id: string) {
    const conflict = await this.prisma.conflict.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, fullName: true } },
        resolutions: {
          include: { resolvedBy: { select: { id: true, fullName: true } } },
        },
      },
    });
    if (!conflict) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Conflict not found' });
    return {
      ...conflict,
      sourceRefs: JSON.parse(conflict.sourceRefs || '[]'),
    };
  }

  async acknowledge(user: any, id: string) {
    await this.prisma.conflict.update({
      where: { id },
      data: { status: 'ACKNOWLEDGED', ownerId: user.id },
    });
    return this.get(id);
  }

  async resolve(user: any, id: string, decision: string, notes?: string) {
    if (!user.permissions.includes(PERMISSIONS.CONFLICTS_RESOLVE)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Cannot resolve conflicts' });
    }
    const conflict = await this.prisma.conflict.findUnique({ where: { id } });
    if (!conflict) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Conflict not found' });
    if (['RESOLVED', 'DISMISSED'].includes(conflict.status)) {
      throw new BadRequestException({ code: 'INVALID_STATE', message: 'Already closed' });
    }

    await this.prisma.conflictResolution.create({
      data: {
        conflictId: id,
        resolvedById: user.id,
        decision,
        notes,
      },
    });

    await this.prisma.conflict.update({
      where: { id },
      data: { status: decision === 'DISMISS' ? 'DISMISSED' : 'RESOLVED', ownerId: user.id },
    });

    await this.audit.log({
      actorId: user.id,
      action: 'CONFLICT_RESOLVED',
      entityType: 'Conflict',
      entityId: id,
      newValue: { decision, notes },
    });

    return this.get(id);
  }
}
