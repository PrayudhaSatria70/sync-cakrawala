import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PERMS = [
  { code: 'dashboard:view', description: 'View dashboard' },
  { code: 'programs:view_all', description: 'View all programs' },
  { code: 'programs:view_scoped', description: 'View scoped programs' },
  { code: 'tasks:create', description: 'Create tasks' },
  { code: 'tasks:assign', description: 'Assign tasks' },
  { code: 'tasks:update', description: 'Update tasks' },
  { code: 'documents:upload', description: 'Upload documents' },
  { code: 'documents:review', description: 'Review documents' },
  { code: 'approvals:decide', description: 'Decide approvals' },
  { code: 'conflicts:resolve', description: 'Resolve conflicts' },
  { code: 'audit:view', description: 'View full audit' },
  { code: 'audit:view_scoped', description: 'View own audit' },
  { code: 'admin:users', description: 'Manage users' },
  { code: 'admin:roles', description: 'Manage roles' },
  { code: 'admin:divisions', description: 'Manage divisions' },
  { code: 'admin:system', description: 'Manage system settings' },
];

const ROLE_PERMS: Record<string, string[]> = {
  SUPER_ADMIN: PERMS.map((p) => p.code),
  OPERATIONS_COORDINATOR: [
    'dashboard:view',
    'programs:view_all',
    'tasks:create',
    'tasks:assign',
    'tasks:update',
    'documents:upload',
    'documents:review',
    'approvals:decide',
    'conflicts:resolve',
    'audit:view',
  ],
  DIVISION_PIC: [
    'dashboard:view',
    'programs:view_scoped',
    'tasks:create',
    'tasks:assign',
    'tasks:update',
    'documents:upload',
    'conflicts:resolve',
    'audit:view_scoped',
  ],
  REVIEWER: [
    'dashboard:view',
    'programs:view_all',
    'documents:upload',
    'documents:review',
    'audit:view',
  ],
  APPROVER: [
    'dashboard:view',
    'programs:view_scoped',
    'documents:upload',
    'documents:review',
    'approvals:decide',
    'audit:view',
  ],
  VIEWER: [
    'dashboard:view',
    'programs:view_scoped',
    'audit:view',
  ],
};

async function main() {
  console.log('Seeding SYNC Cakrawala...');

  await prisma.conflictResolution.deleteMany();
  await prisma.conflict.deleteMany();
  await prisma.approvalStep.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.proposedItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.documentSubmission.deleteMany();
  await prisma.documentVersion.deleteMany();
  await prisma.document.deleteMany();
  await prisma.task.deleteMany();
  await prisma.program.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.division.deleteMany();
  await prisma.systemSettings.deleteMany();

  await prisma.systemSettings.create({
    data: {
      id: 'default',
      googleOidcEnabled: false,
      localAuthEnabled: true,
      allowedEmailDomain: 'cakrawala.ac.id',
    },
  });

  for (const p of PERMS) {
    await prisma.permission.create({ data: p });
  }

  const roles: Record<string, string> = {};
  const roleDefs = [
    { code: 'SUPER_ADMIN', name: 'Super Admin', description: 'Full platform administration' },
    { code: 'OPERATIONS_COORDINATOR', name: 'Operations Coordinator', description: 'Cross-division coordination' },
    { code: 'DIVISION_PIC', name: 'Division PIC', description: 'Division execution owner' },
    { code: 'REVIEWER', name: 'Reviewer', description: 'Document and proposal review' },
    { code: 'APPROVER', name: 'Approver', description: 'Approval decisions' },
    { code: 'VIEWER', name: 'Viewer / Auditor', description: 'Read-only operational visibility' },
  ];

  for (const r of roleDefs) {
    const role = await prisma.role.create({ data: r });
    roles[r.code] = role.id;
    const codes = ROLE_PERMS[r.code];
    const perms = await prisma.permission.findMany({ where: { code: { in: codes } } });
    await prisma.rolePermission.createMany({
      data: perms.map((p) => ({ roleId: role.id, permissionId: p.id })),
    });
  }

  const divisionDefs = [
    { code: 'ACARA', name: 'Acara' },
    { code: 'LOGISTICS', name: 'Logistics' },
    { code: 'FINANCE', name: 'Finance' },
    { code: 'SPONSORSHIP', name: 'Sponsorship' },
    { code: 'MARKETING', name: 'Marketing' },
    { code: 'IT', name: 'IT' },
    { code: 'HR', name: 'HR' },
    { code: 'OPERATIONS', name: 'Operations' },
  ];
  const divisions: Record<string, string> = {};
  for (const d of divisionDefs) {
    const div = await prisma.division.create({ data: d });
    divisions[d.code] = div.id;
  }

  const hash = await bcrypt.hash('Demo123!', 12);

  const admin = await prisma.user.create({
    data: {
      fullName: 'Super Admin',
      email: 'admin@cakrawala.ac.id',
      username: 'admin',
      roleId: roles.SUPER_ADMIN,
      divisionId: divisions.OPERATIONS,
      status: 'ACTIVE',
      authProvider: 'LOCAL',
      passwordHash: hash,
      mustChangePassword: false,
    },
  });

  await prisma.user.create({
    data: {
      fullName: 'Muhammad Sand Prayudha',
      email: 'muhammadsand.prayudha@cakrawala.ac.id',
      username: 'prayudha',
      roleId: roles.SUPER_ADMIN,
      divisionId: divisions.OPERATIONS,
      status: 'ACTIVE',
      authProvider: 'LOCAL',
      passwordHash: hash,
      mustChangePassword: false,
    },
  });

  const coordinator = await prisma.user.create({
    data: {
      fullName: 'Rina Coordinator',
      email: 'coordinator@cakrawala.ac.id',
      username: 'coordinator',
      roleId: roles.OPERATIONS_COORDINATOR,
      divisionId: divisions.OPERATIONS,
      status: 'ACTIVE',
      authProvider: 'LOCAL',
      passwordHash: hash,
      mustChangePassword: false,
    },
  });

  const picCodes = Object.keys(divisions);
  const pics: Record<string, string> = {};
  for (const code of picCodes) {
    const u = await prisma.user.create({
      data: {
        fullName: `PIC ${divisions[code] ? code : code}`,
        email: `pic.${code.toLowerCase()}@cakrawala.ac.id`,
        username: `pic_${code.toLowerCase()}`,
        roleId: roles.DIVISION_PIC,
        divisionId: divisions[code],
        status: 'ACTIVE',
        authProvider: 'LOCAL',
        passwordHash: hash,
        mustChangePassword: false,
      },
    });
    pics[code] = u.id;
  }

  // Fix PIC names to be nicer
  await prisma.user.update({
    where: { id: pics.ACARA },
    data: { fullName: 'Andi Acara' },
  });
  await prisma.user.update({
    where: { id: pics.LOGISTICS },
    data: { fullName: 'Budi Logistics' },
  });
  await prisma.user.update({
    where: { id: pics.SPONSORSHIP },
    data: { fullName: 'Sari Sponsorship' },
  });

  const reviewer1 = await prisma.user.create({
    data: {
      fullName: 'Dewi Reviewer',
      email: 'reviewer1@cakrawala.ac.id',
      username: 'reviewer1',
      roleId: roles.REVIEWER,
      divisionId: divisions.OPERATIONS,
      status: 'ACTIVE',
      authProvider: 'LOCAL',
      passwordHash: hash,
      mustChangePassword: false,
    },
  });

  await prisma.user.create({
    data: {
      fullName: 'Eko Reviewer',
      email: 'reviewer2@cakrawala.ac.id',
      username: 'reviewer2',
      roleId: roles.REVIEWER,
      divisionId: divisions.IT,
      status: 'ACTIVE',
      authProvider: 'LOCAL',
      passwordHash: hash,
      mustChangePassword: false,
    },
  });

  const approver1 = await prisma.user.create({
    data: {
      fullName: 'Fina Approver',
      email: 'approver1@cakrawala.ac.id',
      username: 'approver1',
      roleId: roles.APPROVER,
      divisionId: divisions.FINANCE,
      status: 'ACTIVE',
      authProvider: 'LOCAL',
      passwordHash: hash,
      mustChangePassword: false,
    },
  });

  await prisma.user.create({
    data: {
      fullName: 'Gita Approver',
      email: 'approver2@cakrawala.ac.id',
      username: 'approver2',
      roleId: roles.APPROVER,
      divisionId: divisions.OPERATIONS,
      status: 'ACTIVE',
      authProvider: 'LOCAL',
      passwordHash: hash,
      mustChangePassword: false,
    },
  });

  await prisma.user.create({
    data: {
      fullName: 'Hana Viewer',
      email: 'viewer1@cakrawala.ac.id',
      username: 'viewer1',
      roleId: roles.VIEWER,
      divisionId: divisions.OPERATIONS,
      status: 'ACTIVE',
      authProvider: 'LOCAL',
      passwordHash: hash,
      mustChangePassword: false,
    },
  });

  await prisma.user.create({
    data: {
      fullName: 'Irfan Auditor',
      email: 'viewer2@cakrawala.ac.id',
      username: 'viewer2',
      roleId: roles.VIEWER,
      divisionId: divisions.FINANCE,
      status: 'ACTIVE',
      authProvider: 'LOCAL',
      passwordHash: hash,
      mustChangePassword: false,
    },
  });

  const summit = await prisma.program.create({
    data: {
      name: 'Cakrawala Grand Summit',
      description: 'Flagship semester program coordinating all eight divisions.',
      ownerDivisionId: divisions.ACARA,
      status: 'ACTIVE',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-12-15'),
    },
  });

  const sponsorship = await prisma.program.create({
    data: {
      name: 'Sponsorship Acquisition',
      description: 'Secure and manage sponsorship pipeline for Grand Summit.',
      ownerDivisionId: divisions.SPONSORSHIP,
      status: 'ACTIVE',
    },
  });

  await prisma.program.create({
    data: {
      name: 'Campus Merchandise',
      description: 'Merch design, production, and distribution.',
      ownerDivisionId: divisions.MARKETING,
      status: 'PLANNING',
    },
  });

  await prisma.program.create({
    data: {
      name: 'Venue Operations',
      description: 'Venue booking, stage, and technical operations.',
      ownerDivisionId: divisions.LOGISTICS,
      status: 'ACTIVE',
    },
  });

  const overdue = new Date();
  overdue.setDate(overdue.getDate() - 2);

  await prisma.task.createMany({
    data: [
      {
        title: 'Update stage technical specification',
        description: 'Propagate audio/stage changes to Logistics',
        programId: summit.id,
        divisionId: divisions.ACARA,
        assigneeId: pics.ACARA,
        creatorId: coordinator.id,
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: overdue,
      },
      {
        title: 'Confirm vendor availability',
        description: 'Confirm lighting vendor for summit day',
        programId: summit.id,
        divisionId: divisions.LOGISTICS,
        assigneeId: pics.LOGISTICS,
        creatorId: coordinator.id,
        status: 'ASSIGNED',
        priority: 'URGENT',
        dueDate: overdue,
      },
      {
        title: 'Sponsorship follow-up call',
        programId: sponsorship.id,
        divisionId: divisions.SPONSORSHIP,
        assigneeId: pics.SPONSORSHIP,
        creatorId: coordinator.id,
        status: 'BLOCKED',
        priority: 'HIGH',
        dueDate: overdue,
      },
      {
        title: 'Logistics coordination briefing',
        programId: summit.id,
        divisionId: divisions.LOGISTICS,
        assigneeId: pics.LOGISTICS,
        creatorId: coordinator.id,
        status: 'BACKLOG',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 5 * 86400000),
      },
    ],
  });

  // Seed a draft document record (metadata only — file optional for demo)
  const meetingNote = await prisma.document.create({
    data: {
      fileName: 'grand-summit-meeting-notes.md',
      mimeType: 'text/markdown',
      fileSize: 420,
      storageKey: 'seed/grand-summit-meeting-notes.md',
      title: 'Grand Summit Meeting Notes',
      description: 'Updated stage/audio specification notes',
      uploadedById: pics.ACARA,
      divisionId: divisions.ACARA,
      programId: summit.id,
      status: 'DRAFT',
      versions: {
        create: {
          version: 1,
          storageKey: 'seed/grand-summit-meeting-notes.md',
          fileName: 'grand-summit-meeting-notes.md',
          uploadedById: pics.ACARA,
        },
      },
    },
  });

  await prisma.document.create({
    data: {
      fileName: 'sponsorship-proposal.pdf',
      mimeType: 'application/pdf',
      fileSize: 102400,
      storageKey: 'seed/sponsorship-proposal.pdf',
      title: 'Sponsorship Proposal',
      uploadedById: pics.SPONSORSHIP,
      divisionId: divisions.SPONSORSHIP,
      programId: sponsorship.id,
      status: 'APPROVED',
    },
  });

  await prisma.approval.create({
    data: {
      subjectType: 'DOCUMENT',
      subjectId: meetingNote.id,
      title: 'Sponsorship Proposal — Finance Approval',
      summary: 'Awaiting Finance approver decision for sponsorship package.',
      requesterId: pics.SPONSORSHIP,
      status: 'PENDING',
      riskLevel: 'HIGH',
      currentStep: 0,
      steps: {
        create: [
          {
            stepOrder: 0,
            roleLabel: 'Finance Approver',
            approverId: approver1.id,
            status: 'PENDING',
          },
          {
            stepOrder: 1,
            roleLabel: 'Director / Ops Approver',
            status: 'WAITING',
          },
        ],
      },
    },
  });

  await prisma.approval.create({
    data: {
      subjectType: 'GENERAL',
      title: 'Venue budget revision',
      summary: 'Second pending approval for demo KPIs',
      requesterId: pics.LOGISTICS,
      status: 'PENDING',
      riskLevel: 'MEDIUM',
      currentStep: 0,
      steps: {
        create: [{ stepOrder: 0, roleLabel: 'Approver', approverId: approver1.id, status: 'PENDING' }],
      },
    },
  });

  await prisma.conflict.create({
    data: {
      type: 'DUPLICATE_VENDOR',
      severity: 'HIGH',
      status: 'DETECTED',
      title: 'Duplicate vendor order — Lighting Co.',
      description:
        'Acara and Logistics both planned to order from Lighting Co. on the same day.',
      sourceRefs: JSON.stringify([
        { type: 'division', id: divisions.ACARA, label: 'Acara order draft' },
        { type: 'division', id: divisions.LOGISTICS, label: 'Logistics PO draft' },
      ]),
      ownerId: pics.LOGISTICS,
      recommendation: 'Merge into a single PO under Logistics; cancel Acara duplicate.',
    },
  });

  await prisma.conflict.create({
    data: {
      type: 'INFORMATION_MISMATCH',
      severity: 'MEDIUM',
      status: 'DETECTED',
      title: 'Stage specification mismatch',
      description: 'Meeting notes update audio channels but Logistics still holds v1 sheet.',
      sourceRefs: JSON.stringify([
        { type: 'document', id: meetingNote.id, label: 'Meeting notes' },
      ]),
      recommendation: 'Confirm canonical specification and notify Logistics.',
    },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        actorId: admin.id,
        action: 'USER_CREATED',
        entityType: 'User',
        entityId: coordinator.id,
        newValue: JSON.stringify({ email: coordinator.email }),
      },
      {
        actorId: coordinator.id,
        action: 'TASK_CREATED',
        entityType: 'Task',
        newValue: JSON.stringify({ title: 'Update stage technical specification' }),
      },
      {
        actorId: pics.SPONSORSHIP,
        action: 'APPROVAL_SUBMITTED',
        entityType: 'Approval',
        newValue: JSON.stringify({ title: 'Sponsorship Proposal' }),
      },
      {
        actorId: null,
        action: 'CONFLICT_DETECTED',
        entityType: 'Conflict',
        newValue: JSON.stringify({ type: 'DUPLICATE_VENDOR' }),
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: approver1.id,
        type: 'APPROVAL',
        title: 'Approval waiting',
        message: 'Sponsorship Proposal needs your decision',
        link: '/approvals',
      },
      {
        userId: pics.LOGISTICS,
        type: 'CONFLICT',
        title: 'Conflict detected',
        message: 'Duplicate vendor order flagged',
        link: '/conflicts',
      },
      {
        userId: reviewer1.id,
        type: 'REVIEW',
        title: 'Reviews may arrive',
        message: 'Document submissions will appear in Review Queue',
        link: '/reviews',
      },
    ],
  });

  console.log('Seed complete.');
  console.log('Demo password for all users: Demo123!');
  console.log('Admin: admin@cakrawala.ac.id');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
