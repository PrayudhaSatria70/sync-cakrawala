import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PERMISSIONS } from '@sync/shared';

@Injectable()
export class ProgramsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  private scopeWhere(user: any) {
    if (user.permissions.includes(PERMISSIONS.PROGRAMS_VIEW_ALL)) return {};
    return { ownerDivisionId: user.divisionId };
  }

  async list(user: any) {
    return this.prisma.program.findMany({
      where: this.scopeWhere(user),
      include: {
        ownerDivision: true,
        _count: { select: { tasks: true, documents: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async get(user: any, id: string) {
    const program = await this.prisma.program.findFirst({
      where: { id, ...this.scopeWhere(user) },
      include: {
        ownerDivision: true,
        tasks: { include: { assignee: true, division: true } },
        documents: true,
      },
    });
    if (!program) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Program not found' });
    return program;
  }

  async create(user: any, data: any) {
    const program = await this.prisma.program.create({
      data: {
        name: data.name,
        description: data.description,
        ownerDivisionId: data.ownerDivisionId || user.divisionId,
        status: data.status || 'PLANNING',
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });
    await this.audit.log({
      actorId: user.id,
      action: 'TASK_CREATED',
      entityType: 'Program',
      entityId: program.id,
      newValue: data,
    });
    return program;
  }

  async update(user: any, id: string, data: any) {
    await this.get(user, id);
    return this.prisma.program.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        ownerDivisionId: data.ownerDivisionId,
        status: data.status,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });
  }
}
