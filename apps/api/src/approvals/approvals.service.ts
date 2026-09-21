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
export class ApprovalsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notifications: NotificationsService,
  ) {}

  async list(status?: string) {
    return this.prisma.approval.findMany({
      where: status ? { status } : undefined,
      include: {
        requester: { select: { id: true, fullName: true } },
        steps: {
          include: { approver: { select: { id: true, fullName: true } } },
          orderBy: { stepOrder: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async get(id: string) {
    const approval = await this.prisma.approval.findUnique({
      where: { id },
      include: {
        requester: { select: { id: true, fullName: true, email: true } },
        steps: {
          include: { approver: { select: { id: true, fullName: true } } },
          orderBy: { stepOrder: 'asc' },
        },
      },
    });
    if (!approval) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Approval not found' });
    return approval;
  }

  async create(user: any, data: any) {
    const approval = await this.prisma.approval.create({
      data: {
        subjectType: data.subjectType || 'GENERAL',
        subjectId: data.subjectId,
        title: data.title,
        summary: data.summary,
        requesterId: user.id,
        status: 'PENDING',
        riskLevel: data.riskLevel || 'MEDIUM',
        currentStep: 0,
        steps: {
          create: (data.steps || [{ roleLabel: 'Approver', approverId: null }]).map(
            (s: any, i: number) => ({
              stepOrder: i,
              roleLabel: s.roleLabel,
              approverId: s.approverId,
              status: i === 0 ? 'PENDING' : 'WAITING',
            }),
          ),
        },
      },
      include: { steps: true },
    });

    await this.audit.log({
      actorId: user.id,
      action: 'APPROVAL_SUBMITTED',
      entityType: 'Approval',
      entityId: approval.id,
    });

    return approval;
  }

  private assertCanDecide(user: any) {
    if (!user.permissions.includes(PERMISSIONS.APPROVALS_DECIDE)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Cannot decide approvals' });
    }
  }

  async decide(user: any, id: string, decision: 'APPROVED' | 'RETURNED' | 'REJECTED', comment?: string) {
    this.assertCanDecide(user);
    const approval = await this.get(id);
    if (!['PENDING', 'SUBMITTED'].includes(approval.status)) {
      throw new BadRequestException({ code: 'INVALID_STATE', message: 'Approval not actionable' });
    }

    const current = approval.steps.find((s) => s.stepOrder === approval.currentStep);
    if (current) {
      await this.prisma.approvalStep.update({
        where: { id: current.id },
        data: {
          status: decision,
          approverId: user.id,
          comment,
          decidedAt: new Date(),
        },
      });
    }

    const nextStep = approval.currentStep + 1;
    const hasNext =
      decision === 'APPROVED' && approval.steps.some((s) => s.stepOrder === nextStep);

    if (decision === 'APPROVED' && hasNext) {
      await this.prisma.approval.update({
        where: { id },
        data: { currentStep: nextStep },
      });
      await this.prisma.approvalStep.updateMany({
        where: { approvalId: id, stepOrder: nextStep },
        data: { status: 'PENDING' },
      });
    } else {
      await this.prisma.approval.update({
        where: { id },
        data: { status: decision },
      });
    }

    const actionMap = {
      APPROVED: 'APPROVAL_APPROVED',
      RETURNED: 'APPROVAL_RETURNED',
      REJECTED: 'APPROVAL_REJECTED',
    } as const;

    await this.audit.log({
      actorId: user.id,
      action: actionMap[decision],
      entityType: 'Approval',
      entityId: id,
      newValue: { comment },
    });

    await this.notifications.create(
      approval.requesterId,
      'APPROVAL',
      `Approval ${decision.toLowerCase()}`,
      `"${approval.title}" was ${decision.toLowerCase()}.`,
      `/approvals/${id}`,
    );

    return this.get(id);
  }
}
