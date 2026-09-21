import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PERMISSIONS } from '@sync/shared';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  private scopeWhere(user: any) {
    if (user.permissions.includes(PERMISSIONS.PROGRAMS_VIEW_ALL)) return {};
    return {
      OR: [{ divisionId: user.divisionId }, { assigneeId: user.id }],
    };
  }

  async list(user: any, status?: string) {
    const where: any = this.scopeWhere(user);
    if (status) where.status = status;
    return this.prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, fullName: true } },
        division: true,
        program: true,
      },
      orderBy: [{ dueDate: 'asc' }, { updatedAt: 'desc' }],
    });
  }

  async create(user: any, data: any) {
    if (!user.permissions.includes(PERMISSIONS.TASKS_CREATE)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Cannot create tasks' });
    }
    const task = await this.prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        programId: data.programId,
        divisionId: data.divisionId || user.divisionId,
        assigneeId: data.assigneeId,
        creatorId: user.id,
        status: data.assigneeId ? 'ASSIGNED' : data.status || 'BACKLOG',
        priority: data.priority || 'MEDIUM',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
    });
    await this.audit.log({
      actorId: user.id,
      action: 'TASK_CREATED',
      entityType: 'Task',
      entityId: task.id,
      newValue: data,
    });
    if (data.assigneeId) {
      await this.audit.log({
        actorId: user.id,
        action: 'TASK_ASSIGNED',
        entityType: 'Task',
        entityId: task.id,
        newValue: { assigneeId: data.assigneeId },
      });
    }
    return task;
  }

  async update(user: any, id: string, data: any) {
    const existing = await this.prisma.task.findFirst({
      where: { id, ...this.scopeWhere(user) },
    });
    if (!existing) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Task not found' });

    if (data.assigneeId && !user.permissions.includes(PERMISSIONS.TASKS_ASSIGN)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Cannot assign tasks' });
    }

    const task = await this.prisma.task.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        assigneeId: data.assigneeId,
        divisionId: data.divisionId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    });

    await this.audit.log({
      actorId: user.id,
      action: 'TASK_UPDATED',
      entityType: 'Task',
      entityId: id,
      oldValue: existing,
      newValue: data,
    });

    return task;
  }
}
