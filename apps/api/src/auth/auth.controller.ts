import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators/permissions.decorator';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';

class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  password: string;
}

class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}

class RequestPasswordResetDto {
  @IsEmail()
  email: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private audit: AuditService,
  ) {}

  @Public()
  @Get('google/info')
  googleInfo() {
    return this.auth.getGoogleAuthInfo();
  }

  @Public()
  @Get('google')
  googleStart(@Res() res: any) {
    const info = this.auth.getGoogleAuthInfo();
    if (!info.enabled) {
      return res.status(501).json({
        code: 'GOOGLE_OIDC_DISABLED',
        message: info.message,
      });
    }
    return res.status(501).json({
      code: 'GOOGLE_OIDC_NOT_CONFIGURED',
      message: 'Set GOOGLE_CLIENT_ID/SECRET and enable GOOGLE_OIDC_ENABLED',
    });
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Req() req: any) {
    const user = await this.auth.loginLocal(dto.email, dto.password);
    req.session.userId = user.id;
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      mustChangePassword: user.mustChangePassword,
    };
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: any, @CurrentUser() user: any) {
    await this.audit.log({
      actorId: user?.id,
      action: 'USER_LOGOUT',
      entityType: 'User',
      entityId: user?.id,
    });
    return new Promise((resolve) => {
      req.session.destroy(() => resolve({ success: true }));
    });
  }

  @UseGuards(AuthGuard)
  @Post('change-password')
  @HttpCode(200)
  async changePassword(@CurrentUser() user: any, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(user.id, dto.currentPassword, dto.newPassword);
  }

  @Public()
  @Post('request-password-reset')
  @HttpCode(200)
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.auth.requestPasswordReset(dto.email);
  }
}
