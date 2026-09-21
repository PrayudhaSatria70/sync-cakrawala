import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsBoolean,
  IsArray,
  MinLength,
} from 'class-validator';
import { AdminService } from './admin.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PERMISSIONS } from '@sync/shared';

class CreateUserDto {
  @IsString() fullName: string;
  @IsEmail() email: string;
  @IsOptional() @IsString() username?: string;
  @IsString() roleId: string;
  @IsOptional() @IsString() divisionId?: string;
  @IsOptional() @IsString() authProvider?: string;
  @IsOptional() @IsString() @MinLength(8) password?: string;
  @IsOptional() @IsBoolean() mustChangePassword?: boolean;
  @IsOptional() @IsString() status?: string;
}

class UpdateUserDto {
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsString() username?: string;
  @IsOptional() @IsString() roleId?: string;
  @IsOptional() @IsString() divisionId?: string;
  @IsOptional() @IsString() authProvider?: string;
  @IsOptional() @IsString() status?: string;
}

class StatusDto {
  @IsString() status: string;
}

class ResetPasswordDto {
  @IsOptional() @IsString() temporaryPassword?: string;
}

class RolePermissionsDto {
  @IsArray() permissionCodes: string[];
}

class DivisionDto {
  @IsString() code: string;
  @IsString() name: string;
}

class UpdateDivisionDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() status?: string;
}

@Controller('admin')
@UseGuards(AuthGuard, PermissionsGuard)
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get('users')
  @RequirePermissions(PERMISSIONS.ADMIN_USERS)
  listUsers(@Query('q') q?: string, @Query('status') status?: string) {
    return this.admin.listUsers(q, status);
  }

  @Get('users/:id')
  @RequirePermissions(PERMISSIONS.ADMIN_USERS)
  getUser(@Param('id') id: string) {
    return this.admin.getUser(id);
  }

  @Post('users')
  @RequirePermissions(PERMISSIONS.ADMIN_USERS)
  createUser(@CurrentUser() user: any, @Body() dto: CreateUserDto) {
    return this.admin.createUser(user.id, dto);
  }

  @Patch('users/:id')
  @RequirePermissions(PERMISSIONS.ADMIN_USERS)
  updateUser(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.admin.updateUser(user.id, id, dto);
  }

  @Post('users/:id/status')
  @RequirePermissions(PERMISSIONS.ADMIN_USERS)
  setStatus(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: StatusDto) {
    return this.admin.setUserStatus(user.id, id, dto.status);
  }

  @Post('users/:id/reset-password')
  @RequirePermissions(PERMISSIONS.ADMIN_USERS)
  resetPassword(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.admin.resetPassword(user.id, id, dto.temporaryPassword);
  }

  @Get('roles')
  @RequirePermissions(PERMISSIONS.ADMIN_ROLES)
  listRoles() {
    return this.admin.listRoles();
  }

  @Get('permissions')
  @RequirePermissions(PERMISSIONS.ADMIN_ROLES)
  listPermissions() {
    return this.admin.listPermissions();
  }

  @Patch('roles/:id')
  @RequirePermissions(PERMISSIONS.ADMIN_ROLES)
  updateRole(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: RolePermissionsDto,
  ) {
    return this.admin.updateRolePermissions(user.id, id, dto.permissionCodes);
  }

  @Get('divisions')
  @RequirePermissions(PERMISSIONS.ADMIN_DIVISIONS)
  listDivisions() {
    return this.admin.listDivisions();
  }

  @Post('divisions')
  @RequirePermissions(PERMISSIONS.ADMIN_DIVISIONS)
  createDivision(@CurrentUser() user: any, @Body() dto: DivisionDto) {
    return this.admin.createDivision(user.id, dto);
  }

  @Patch('divisions/:id')
  @RequirePermissions(PERMISSIONS.ADMIN_DIVISIONS)
  updateDivision(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateDivisionDto,
  ) {
    return this.admin.updateDivision(user.id, id, dto);
  }

  @Get('divisions/:id/impact')
  @RequirePermissions(PERMISSIONS.ADMIN_DIVISIONS)
  divisionImpact(@Param('id') id: string) {
    return this.admin.getDivisionImpact(id);
  }

  @Get('system-settings')
  @RequirePermissions(PERMISSIONS.ADMIN_SYSTEM)
  getSettings() {
    return this.admin.getSystemSettings();
  }

  @Patch('system-settings')
  @RequirePermissions(PERMISSIONS.ADMIN_SYSTEM)
  updateSettings(@CurrentUser() user: any, @Body() body: any) {
    return this.admin.updateSystemSettings(user.id, body);
  }
}
