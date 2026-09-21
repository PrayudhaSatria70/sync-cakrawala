import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

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

export async function autoSeedIfEmpty(prisma: PrismaClient): Promise<void> {
  try {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return;
    }

    console.log('[Seed] Database has 0 users. Performing automatic initial seed...');

    await prisma.systemSettings.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        googleOidcEnabled: false,
        localAuthEnabled: true,
        allowedEmailDomain: 'cakrawala.ac.id',
      },
      update: {},
    });

    for (const p of PERMS) {
      await prisma.permission.upsert({
        where: { code: p.code },
        create: p,
        update: {},
      });
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
      const role = await prisma.role.upsert({
        where: { code: r.code },
        create: r,
        update: {},
      });
      roles[r.code] = role.id;

      const codes = ROLE_PERMS[r.code] || [];
      const perms = await prisma.permission.findMany({ where: { code: { in: codes } } });
      for (const p of perms) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: p.id } },
          create: { roleId: role.id, permissionId: p.id },
          update: {},
        });
      }
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
      const div = await prisma.division.upsert({
        where: { code: d.code },
        create: d,
        update: {},
      });
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

    const picAcara = await prisma.user.create({
      data: {
        fullName: 'Andi Acara',
        email: 'pic.acara@cakrawala.ac.id',
        username: 'pic_acara',
        roleId: roles.DIVISION_PIC,
        divisionId: divisions.ACARA,
        status: 'ACTIVE',
        authProvider: 'LOCAL',
        passwordHash: hash,
        mustChangePassword: false,
      },
    });

    const picLogistics = await prisma.user.create({
      data: {
        fullName: 'Budi Logistics',
        email: 'pic.logistics@cakrawala.ac.id',
        username: 'pic_logistics',
        roleId: roles.DIVISION_PIC,
        divisionId: divisions.LOGISTICS,
        status: 'ACTIVE',
        authProvider: 'LOCAL',
        passwordHash: hash,
        mustChangePassword: false,
      },
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
        fullName: 'Gita Viewer',
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

    // Initial Program
    const programSummit = await prisma.program.create({
      data: {
        name: 'Grand Summit Cakrawala 2026',
        description: 'Annual multi-division flagship symposium',
        ownerDivisionId: divisions.ACARA,
        status: 'IN_PROGRESS',
        startDate: new Date('2026-10-01'),
        endDate: new Date('2026-10-05'),
      },
    });

    // Initial Task
    await prisma.task.create({
      data: {
        programId: programSummit.id,
        title: 'Finalisasi Rundown & Audio Grand Summit',
        description: 'Sinkronisasi rundown acara utama dengan spesifikasi audio panggung.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        creatorId: coordinator.id,
        assigneeId: picAcara.id,
        divisionId: divisions.ACARA,
        dueDate: new Date('2026-09-30'),
      },
    });

    // Initial Conflict for Golden Demo
    await prisma.conflict.create({
      data: {
        type: 'DUPLICATE_VENDOR',
        severity: 'HIGH',
        status: 'DETECTED',
        title: 'Potensi Pemesanan Ganda (Vendor Sound & Stage ABC)',
        description: 'Divisi Acara memesan 150 unit audio sistem, sedangkan Divisi Logistik memesan 100 unit ke vendor yang sama untuk Grand Summit 2026.',
        sourceRefs: JSON.stringify({ acaraOrderId: 'PO-ACARA-2026-01', logisticsOrderId: 'PO-LOG-2026-04' }),
        ownerId: picLogistics.id,
        recommendation: 'Lakukan konsolidasi pesanan ke satu Purchase Order resmi agar tidak terjadi double-billing.',
      },
    });

    // Initial Approval for Golden Demo
    const approval = await prisma.approval.create({
      data: {
        subjectType: 'SPONSORSHIP_PROPOSAL',
        title: 'Proposal Sponsorship Platinum Cakrawala 2026',
        summary: 'Pengajuan paket kerja sama sponsor industri kategori Platinum senilai Rp 150.000.000.',
        requesterId: coordinator.id,
        currentStep: 1,
        status: 'IN_REVIEW',
        riskLevel: 'HIGH',
      },
    });

    await prisma.approvalStep.createMany({
      data: [
        {
          approvalId: approval.id,
          stepOrder: 0,
          approverId: coordinator.id,
          roleLabel: 'PIC Pengusul',
          status: 'APPROVED',
          comment: 'Proposal terverifikasi lengkap.',
          decidedAt: new Date(),
        },
        {
          approvalId: approval.id,
          stepOrder: 1,
          approverId: approver1.id,
          roleLabel: 'Finance Approver',
          status: 'PENDING',
        },
        {
          approvalId: approval.id,
          stepOrder: 2,
          approverId: admin.id,
          roleLabel: 'Director / Super Admin',
          status: 'PENDING',
        },
      ],
    });

    console.log('[Seed] Automatic initial seed completed successfully!');
    console.log('[Seed] Demo accounts ready: admin@cakrawala.ac.id, Demo123!');
  } catch (err) {
    console.error('[Seed] Automatic seed encountered an error:', err);
  }
}
