import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PERMISSIONS } from '@sync/shared';

@Controller('audit')
@UseGuards(AuthGuard, PermissionsGuard)
export class AuditController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.AUDIT_VIEW, PERMISSIONS.AUDIT_VIEW_SCOPED)
  async list(
    @CurrentUser() user: any,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
  ) {
    const take = Math.min(parseInt(limit, 10) || 50, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;
    const where: any = {};
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (
      !user.permissions.includes(PERMISSIONS.AUDIT_VIEW) &&
      user.permissions.includes(PERMISSIONS.AUDIT_VIEW_SCOPED)
    ) {
      where.actorId = user.id;
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: { actor: { select: { id: true, fullName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total, page: Number(page), limit: take };
  }
}
