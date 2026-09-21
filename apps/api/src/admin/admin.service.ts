import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async listUsers(q?: string, status?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { fullName: { contains: q } },
        { email: { contains: q } },
      ];
    }
    return this.prisma.user.findMany({
      where,
      include: {
        role: { select: { id: true, code: true, name: true } },
        division: { select: { id: true, code: true, name: true } },
      },
      orderBy: { fullName: 'asc' },
    });
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: { select: { id: true, code: true, name: true, description: true } },
        division: { select: { id: true, code: true, name: true } },
      },
    });
    if (!user) throw new NotFoundException({ code: 'NOT_FOUND', message: 'User not found' });
    return user;
  }

  async createUser(
    actorId: string,
    data: {
      fullName: string;
      email: string;
      username?: string;
      roleId: string;
      divisionId?: string;
      authProvider?: string;
      password?: string;
      mustChangePassword?: boolean;
      status?: string;
    },
  ) {
    const passwordHash = data.password
      ? await bcrypt.hash(data.password, 12)
      : await bcrypt.hash('ChangeMe123!', 12);

    const user = await this.prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email.toLowerCase(),
        username: data.username,
        roleId: data.roleId,
        divisionId: data.divisionId || null,
        authProvider: data.authProvider || 'LOCAL',
        passwordHash,
        mustChangePassword: data.mustChangePassword ?? true,
        status: data.status || 'PENDING',
      },
      include: { role: true, division: true },
    });

    await this.audit.log({
      actorId,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: user.id,
      newValue: { email: user.email, roleId: user.roleId },
    });

    return user;
  }

  async updateUser(actorId: string, id: string, data: any) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException({ code: 'NOT_FOUND', message: 'User not found' });

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        fullName: data.fullName,
        username: data.username,
        roleId: data.roleId,
        divisionId: data.divisionId,
        authProvider: data.authProvider,
        status: data.status,
      },
      include: { role: true, division: true },
    });

    await this.audit.log({
      actorId,
      action: 'USER_UPDATED',
      entityType: 'User',
      entityId: id,
      oldValue: existing,
      newValue: data,
    });

    return user;
  }

  async setUserStatus(actorId: string, id: string, status: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { status },
    });
    await this.audit.log({
      actorId,
      action: 'USER_STATUS_CHANGED',
      entityType: 'User',
      entityId: id,
      newValue: { status },
    });
    return user;
  }

  async resetPassword(actorId: string, id: string, temporaryPassword?: string) {
    const pwd = temporaryPassword || 'TempPass123!';
    const passwordHash = await bcrypt.hash(pwd, 12);
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash, mustChangePassword: true },
    });
    await this.audit.log({
      actorId,
      action: 'PASSWORD_RESET_REQUESTED',
      entityType: 'User',
      entityId: id,
    });
    return { success: true, temporaryPassword: pwd };
  }

  async listRoles() {
    return this.prisma.role.findMany({
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async listPermissions() {
    return this.prisma.permission.findMany({ orderBy: { code: 'asc' } });
  }

  async updateRolePermissions(actorId: string, roleId: string, permissionCodes: string[]) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Role not found' });

    const permissions = await this.prisma.permission.findMany({
      where: { code: { in: permissionCodes } },
    });

    await this.prisma.rolePermission.deleteMany({ where: { roleId } });
    await this.prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId, permissionId: p.id })),
    });

    await this.audit.log({
      actorId,
      action: 'PERMISSION_CHANGED',
      entityType: 'Role',
      entityId: roleId,
      newValue: { permissionCodes },
    });

    return this.listRoles();
  }

  async listDivisions() {
    const divisions = await this.prisma.division.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { users: true, programs: true, tasks: true, documents: true },
        },
      },
    });
    return divisions;
  }

  async createDivision(actorId: string, data: { code: string; name: string }) {
    const division = await this.prisma.division.create({ data });
    await this.audit.log({
      actorId,
      action: 'DIVISION_ASSIGNED',
      entityType: 'Division',
      entityId: division.id,
      newValue: data,
    });
    return division;
  }

  async updateDivision(actorId: string, id: string, data: { name?: string; status?: string }) {
    if (data.status === 'INACTIVE') {
      const impact = await this.prisma.division.findUnique({
        where: { id },
        include: {
          _count: {
            select: { users: true, programs: true, tasks: true, documents: true },
          },
        },
      });
      if (!impact) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Division not found' });
    }

    const division = await this.prisma.division.update({ where: { id }, data });
    await this.audit.log({
      actorId,
      action: 'DIVISION_ASSIGNED',
      entityType: 'Division',
      entityId: id,
      newValue: data,
    });
    return division;
  }

  async getDivisionImpact(id: string) {
    const division = await this.prisma.division.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true, programs: true, tasks: true, documents: true },
        },
      },
    });
    if (!division) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Division not found' });
    return {
      id: division.id,
      name: division.name,
      impact: division._count,
    };
  }

  async getSystemSettings() {
    let settings = await this.prisma.systemSettings.findUnique({ where: { id: 'default' } });
    if (!settings) {
      settings = await this.prisma.systemSettings.create({ data: { id: 'default' } });
    }
    return settings;
  }

  async updateSystemSettings(actorId: string, data: any) {
    const settings = await this.prisma.systemSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...data },
      update: data,
    });
    await this.audit.log({
      actorId,
      action: 'PERMISSION_CHANGED',
      entityType: 'SystemSettings',
      entityId: 'default',
      newValue: data,
    });
    return settings;
  }
}
