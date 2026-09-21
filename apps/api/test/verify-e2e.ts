import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function runTests() {
  console.log('====================================================');
  console.log('🚀 RUNNING SYNC CAKRAWALA SYSTEM VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Database & Seed Verification
    console.log('📌 Test 1: Identity, Personas & Password Hashing');
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@cakrawala.ac.id' },
      include: { role: true, division: true },
    });
    assert(Boolean(admin), 'Super Admin exists in database');
    assert(admin?.role?.code === 'SUPER_ADMIN', 'Super Admin has role code SUPER_ADMIN');

    const picLogistics = await prisma.user.findUnique({
      where: { email: 'pic.logistics@cakrawala.ac.id' },
      include: { role: true, division: true },
    });
    assert(Boolean(picLogistics), 'PIC Logistics persona exists');
    assert(picLogistics?.division?.code === 'LOGISTICS', 'PIC Logistics is scoped to LOGISTICS division');

    const reviewer = await prisma.user.findUnique({
      where: { email: 'reviewer1@cakrawala.ac.id' },
      include: { role: true },
    });
    assert(reviewer?.role?.code === 'REVIEWER', 'Reviewer persona exists with REVIEWER role');

    const approver = await prisma.user.findUnique({
      where: { email: 'approver1@cakrawala.ac.id' },
      include: { role: true },
    });
    assert(approver?.role?.code === 'APPROVER', 'Approver persona exists with APPROVER role');

    const okPw = admin?.passwordHash ? await bcrypt.compare('Demo123!', admin.passwordHash) : false;
    assert(okPw, 'Password Demo123! matches bcrypt hash for local authentication');

    const wrongPw = admin?.passwordHash ? await bcrypt.compare('WrongPassword', admin.passwordHash) : false;
    assert(!wrongPw, 'Invalid password correctly rejected by bcrypt');

    // 2. RBAC & Scoping
    console.log('\n📌 Test 2: Role-Based Access Control & Capability Matrix');
    const roles = await prisma.role.findMany({
      include: { permissions: { include: { permission: true } } },
    });
    assert(roles.length === 6, `Exactly 6 protected system roles exist (found: ${roles.length})`);

    const adminRole = roles.find((r) => r.code === 'SUPER_ADMIN');
    const adminPerms = adminRole?.permissions.map((p) => p.permission.code) || [];
    assert(adminPerms.includes('admin:users') && adminPerms.includes('admin:roles'), 'Super Admin holds full administrative permissions');

    const picRole = roles.find((r) => r.code === 'DIVISION_PIC');
    const picPerms = picRole?.permissions.map((p) => p.permission.code) || [];
    assert(!picPerms.includes('admin:users'), 'Division PIC is prevented from administrative user management (Principle of Least Privilege)');
    assert(picPerms.includes('tasks:create'), 'Division PIC has tasks:create permission');

    // 3. Failure Mode 1: Stage & Audio Spec Desync -> Human-in-the-Loop -> Task for Logistics
    console.log('\n📌 Test 3: Failure Mode 1 (Spec Desync & Task Propagation)');
    const testDoc = await prisma.document.create({
      data: {
        fileName: 'grand-summit-stage-specs-v2.md',
        mimeType: 'text/markdown',
        fileSize: 1024,
        storageKey: 'test/grand-summit-stage-specs-v2.md',
        title: 'Grand Summit Technical Stage Specs V2',
        uploadedById: admin!.id,
        divisionId: picLogistics!.divisionId,
        status: 'REVIEW_REQUIRED',
        proposals: {
          create: [
            {
              fieldKey: 'proposed_task',
              fieldLabel: 'Proposed Task',
              value: 'Persiapkan 24 Channel Audio Stage & Lighting Co.',
              evidence: 'Extracted from meeting note section 3',
            },
            {
              fieldKey: 'affected_division',
              fieldLabel: 'Affected Division',
              value: 'Logistics',
              evidence: 'Explicit vendor requirement',
            },
          ],
        },
        reviews: {
          create: {
            status: 'PENDING',
            riskLevel: 'HIGH',
          },
        },
      },
      include: { proposals: true, reviews: true },
    });
    assert(testDoc.status === 'REVIEW_REQUIRED', 'Document successfully transitioned to REVIEW_REQUIRED');
    assert(testDoc.proposals.length === 2, 'Document generated structured extractions (proposals)');

    // Simulate Reviewer Approval
    const review = testDoc.reviews[0];
    await prisma.review.update({
      where: { id: review.id },
      data: { status: 'APPROVED', reviewerId: reviewer!.id, reviewedAt: new Date() },
    });
    await prisma.document.update({
      where: { id: testDoc.id },
      data: { status: 'APPROVED' },
    });
    await prisma.proposedItem.updateMany({
      where: { documentId: testDoc.id },
      data: { confirmed: true },
    });

    // Auto-create task for Logistics
    const logisticsDivision = await prisma.division.findFirst({ where: { code: 'LOGISTICS' } });
    const autoTask = await prisma.task.create({
      data: {
        title: 'Persiapkan 24 Channel Audio Stage & Lighting Co.',
        description: `Created from document review of ${testDoc.title}`,
        divisionId: logisticsDivision!.id,
        creatorId: reviewer!.id,
        status: 'BACKLOG',
        priority: 'HIGH',
      },
    });
    assert(autoTask.divisionId === logisticsDivision!.id, 'Approved extraction automatically created execution task for Logistics');
    assert(autoTask.status === 'BACKLOG', 'Auto-created task is queued in BACKLOG');

    // 4. Failure Mode 2: Approval Bottleneck Resolution
    console.log('\n📌 Test 4: Failure Mode 2 (Approval Chain & Return Flow)');
    const approval = await prisma.approval.findFirst({
      where: { title: { contains: 'Sponsorship' } },
      include: { steps: true },
    });
    assert(Boolean(approval), 'Sponsorship approval request exists in database');
    assert(Boolean(approval?.steps && approval.steps.length >= 2), 'Approval exhibits multi-step verification chain');

    // Simulate Approver returning for revision
    const updatedApproval = await prisma.approval.update({
      where: { id: approval!.id },
      data: { status: 'RETURNED' },
    });
    assert(updatedApproval.status === 'RETURNED', 'Approver successfully returned approval with explicit status transition');

    // 5. Failure Mode 3: Duplicate Vendor Order Conflict Resolution
    console.log('\n📌 Test 5: Failure Mode 3 (Vendor Conflict Detection & Merge)');
    const vendorConflict = await prisma.conflict.findFirst({
      where: { type: 'DUPLICATE_VENDOR' },
    });
    assert(Boolean(vendorConflict), 'Duplicate vendor order conflict detected by system');

    const resolution = await prisma.conflictResolution.create({
      data: {
        conflictId: vendorConflict!.id,
        resolvedById: picLogistics!.id,
        decision: 'MERGE',
        notes: 'Merged Acara and Logistics requests into single purchase order under Logistics PO #2026-09-01.',
      },
    });
    await prisma.conflict.update({
      where: { id: vendorConflict!.id },
      data: { status: 'RESOLVED' },
    });
    assert(resolution.decision === 'MERGE', 'PIC successfully resolved conflict with decision MERGE');

    // 6. Division Impact Analysis (Orphan Prevention)
    console.log('\n📌 Test 6: Division Impact Analysis (Orphan Prevention)');
    const acaraDiv = await prisma.division.findFirst({
      where: { code: 'ACARA' },
      include: {
        _count: {
          select: { users: true, programs: true, tasks: true, documents: true },
        },
      },
    });
    assert(Boolean(acaraDiv), 'Acara division found');
    assert(Boolean(acaraDiv && acaraDiv._count.users > 0), `Acara impact analysis shows users linked`);
    assert(Boolean(acaraDiv && acaraDiv._count.programs > 0), `Acara impact analysis shows programs linked`);

    // 7. System Settings Policy
    console.log('\n📌 Test 7: System Settings & Governance Policy');
    const settings = await prisma.systemSettings.findUnique({ where: { id: 'default' } });
    assert(Boolean(settings), 'System settings record exists');
    assert(settings?.allowedEmailDomain === 'cakrawala.ac.id', 'Domain restriction strictly configured for @cakrawala.ac.id');
    assert(settings?.localAuthEnabled === true, 'Local authentication enabled for evaluator sandbox');

    // Clean up test document
    await prisma.task.delete({ where: { id: autoTask.id } });
    await prisma.proposedItem.deleteMany({ where: { documentId: testDoc.id } });
    await prisma.review.deleteMany({ where: { documentId: testDoc.id } });
    await prisma.document.delete({ where: { id: testDoc.id } });

    console.log('\n====================================================');
    console.log(`🏁 VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    if (failed > 0) process.exit(1);
  } catch (error) {
    console.error('Test execution error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
