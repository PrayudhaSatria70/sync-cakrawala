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
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notifications: NotificationsService,
  ) {}

  async list(status = 'PENDING') {
    return this.prisma.review.findMany({
      where: status ? { status } : undefined,
      include: {
        document: {
          include: {
            uploadedBy: { select: { id: true, fullName: true } },
            division: true,
            proposals: true,
          },
        },
        reviewer: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async get(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        document: {
          include: {
            uploadedBy: { select: { id: true, fullName: true, email: true } },
            division: true,
            proposals: true,
            versions: true,
          },
        },
        reviewer: { select: { id: true, fullName: true } },
      },
    });
    if (!review) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Review not found' });
    return review;
  }

  private assertCanReview(user: any) {
    if (!user.permissions.includes(PERMISSIONS.DOCUMENTS_REVIEW)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Cannot review documents' });
    }
  }

  async updateProposals(user: any, reviewId: string, proposals: { id: string; value: string }[]) {
    this.assertCanReview(user);
    const review = await this.get(reviewId);
    for (const p of proposals) {
      await this.prisma.proposedItem.update({
        where: { id: p.id },
        data: { value: p.value },
      });
    }
    return this.get(review.id);
  }

  async approve(user: any, id: string, comment?: string) {
    this.assertCanReview(user);
    const review = await this.get(id);
    if (review.status !== 'PENDING') {
      throw new BadRequestException({ code: 'INVALID_STATE', message: 'Review already decided' });
    }

    await this.prisma.review.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewerId: user.id,
        comment,
        reviewedAt: new Date(),
      },
    });

    await this.prisma.document.update({
      where: { id: review.documentId },
      data: { status: 'APPROVED' },
    });

    await this.prisma.proposedItem.updateMany({
      where: { documentId: review.documentId },
      data: { confirmed: true },
    });

    const taskProposal = review.document.proposals.find((p) => p.fieldKey === 'proposed_task');
    const deadline = review.document.proposals.find((p) => p.fieldKey === 'deadline_hint');
    if (taskProposal) {
      const logistics = await this.prisma.division.findFirst({ where: { code: 'LOGISTICS' } });
      await this.prisma.task.create({
        data: {
          title: taskProposal.value,
          description: `Created from document review of ${review.document.title}`,
          programId: review.document.programId,
          divisionId: logistics?.id || review.document.divisionId,
          creatorId: user.id,
          status: 'BACKLOG',
          priority: 'HIGH',
          dueDate: deadline?.value ? new Date(deadline.value) : null,
        },
      });
    }

    await this.audit.log({
      actorId: user.id,
      action: 'DOCUMENT_APPROVED',
      entityType: 'Review',
      entityId: id,
    });
    await this.audit.log({
      actorId: user.id,
      action: 'DOCUMENT_REVIEWED',
      entityType: 'Document',
      entityId: review.documentId,
    });

    await this.notifications.create(
      review.document.uploadedById,
      'REVIEW',
      'Document approved',
      `Your document "${review.document.title}" was approved.`,
      `/documents/${review.documentId}`,
    );

    return this.get(id);
  }

  async returnReview(user: any, id: string, comment: string) {
    this.assertCanReview(user);
    const review = await this.get(id);
    await this.prisma.review.update({
      where: { id },
      data: {
        status: 'RETURNED',
        reviewerId: user.id,
        comment,
        reviewedAt: new Date(),
      },
    });
    await this.prisma.document.update({
      where: { id: review.documentId },
      data: { status: 'RETURNED' },
    });
    await this.audit.log({
      actorId: user.id,
      action: 'DOCUMENT_RETURNED',
      entityType: 'Document',
      entityId: review.documentId,
      newValue: { comment },
    });
    return this.get(id);
  }

  async reject(user: any, id: string, comment: string) {
    this.assertCanReview(user);
    const review = await this.get(id);
    await this.prisma.review.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewerId: user.id,
        comment,
        reviewedAt: new Date(),
      },
    });
    await this.prisma.document.update({
      where: { id: review.documentId },
      data: { status: 'REJECTED' },
    });
    await this.audit.log({
      actorId: user.id,
      action: 'DOCUMENT_REJECTED',
      entityType: 'Document',
      entityId: review.documentId,
      newValue: { comment },
    });
    return this.get(id);
  }
}
