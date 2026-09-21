import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { StorageService } from '../storage/storage.service';
import { PERMISSIONS } from '@sync/shared';

const ALLOWED_EXT = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv',
  '.ppt', '.pptx', '.txt', '.md', '.jpg', '.jpeg', '.png', '.webp',
];
const BLOCKED_EXT = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.dll', '.js', '.mjs', '.cjs'];

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private storage: StorageService,
  ) {}

  async list(user: any, status?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (!user.permissions.includes(PERMISSIONS.PROGRAMS_VIEW_ALL)) {
      where.OR = [{ divisionId: user.divisionId }, { uploadedById: user.id }];
    }
    return this.prisma.document.findMany({
      where,
      include: {
        uploadedBy: { select: { id: true, fullName: true } },
        division: true,
        program: true,
        _count: { select: { proposals: true, reviews: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async get(id: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: {
        uploadedBy: { select: { id: true, fullName: true, email: true } },
        division: true,
        program: true,
        versions: { orderBy: { version: 'desc' } },
        submissions: {
          include: { submittedBy: { select: { id: true, fullName: true } } },
          orderBy: { submittedAt: 'desc' },
        },
        reviews: {
          include: { reviewer: { select: { id: true, fullName: true } } },
          orderBy: { createdAt: 'desc' },
        },
        proposals: true,
      },
    });
    if (!doc) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Document not found' });
    return doc;
  }

  async upload(
    user: any,
    file: Express.Multer.File,
    meta: { title?: string; description?: string; divisionId?: string; programId?: string },
  ) {
    if (!user.permissions.includes(PERMISSIONS.DOCUMENTS_UPLOAD)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Cannot upload documents' });
    }
    if (!file) {
      throw new BadRequestException({ code: 'NO_FILE', message: 'File is required' });
    }

    const lower = file.originalname.toLowerCase();
    const ext = lower.includes('.') ? lower.slice(lower.lastIndexOf('.')) : '';
    if (BLOCKED_EXT.includes(ext) || (ext && !ALLOWED_EXT.includes(ext))) {
      throw new BadRequestException({
        code: 'INVALID_FILE_TYPE',
        message: `File type ${ext || 'unknown'} is not allowed`,
      });
    }

    const settings = await this.prisma.systemSettings.findUnique({ where: { id: 'default' } });
    const max = settings?.maxUploadBytes ?? 10 * 1024 * 1024;
    if (file.size > max) {
      throw new BadRequestException({
        code: 'FILE_TOO_LARGE',
        message: `Max upload size is ${max} bytes`,
      });
    }

    const storageKey = await this.storage.save(file);
    const doc = await this.prisma.document.create({
      data: {
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        storageKey,
        title: meta.title || file.originalname,
        description: meta.description,
        uploadedById: user.id,
        divisionId: meta.divisionId || user.divisionId,
        programId: meta.programId,
        status: 'DRAFT',
        versions: {
          create: {
            version: 1,
            storageKey,
            fileName: file.originalname,
            uploadedById: user.id,
          },
        },
      },
    });

    await this.audit.log({
      actorId: user.id,
      action: 'DOCUMENT_UPLOADED',
      entityType: 'Document',
      entityId: doc.id,
      newValue: { fileName: doc.fileName },
    });

    return doc;
  }

  async submit(user: any, id: string) {
    const doc = await this.get(id);
    if (!['DRAFT', 'RETURNED'].includes(doc.status)) {
      throw new BadRequestException({
        code: 'INVALID_STATE',
        message: `Cannot submit document in status ${doc.status}`,
      });
    }

    await this.prisma.document.update({
      where: { id },
      data: { status: 'SUBMITTED' },
    });

    await this.prisma.documentSubmission.create({
      data: {
        documentId: id,
        submittedById: user.id,
        status: 'SUBMITTED',
      },
    });

    await this.audit.log({
      actorId: user.id,
      action: 'DOCUMENT_SUBMITTED',
      entityType: 'Document',
      entityId: id,
    });

    // PROCESSING → stub extraction → REVIEW_REQUIRED
    await this.prisma.document.update({
      where: { id },
      data: { status: 'PROCESSING' },
    });

    const proposals = [
      {
        fieldKey: 'proposed_task',
        fieldLabel: 'Proposed Task',
        value: `Follow up on ${doc.title || doc.fileName}`,
        evidence: 'Extracted from document title/filename (stub extractor)',
      },
      {
        fieldKey: 'affected_division',
        fieldLabel: 'Affected Division',
        value: 'Logistics',
        evidence: 'Heuristic: operational documents often affect Logistics',
      },
      {
        fieldKey: 'deadline_hint',
        fieldLabel: 'Suggested Deadline',
        value: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        evidence: 'Default +7 days proposal',
      },
    ];

    await this.prisma.proposedItem.createMany({
      data: proposals.map((p) => ({ ...p, documentId: id })),
    });

    await this.prisma.document.update({
      where: { id },
      data: { status: 'REVIEW_REQUIRED' },
    });

    await this.prisma.review.create({
      data: {
        documentId: id,
        status: 'PENDING',
        riskLevel: 'MEDIUM',
      },
    });

    return this.get(id);
  }

  async mySubmissions(user: any) {
    return this.prisma.documentSubmission.findMany({
      where: { submittedById: user.id },
      include: {
        document: true,
      },
      orderBy: { submittedAt: 'desc' },
    });
  }
}
