import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, IsBoolean, IsIn } from 'class-validator';
import { UsersService } from './users.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsIn(['light', 'dark'])
  theme?: string;

  @IsOptional()
  @IsIn(['comfortable', 'compact'])
  density?: string;

  @IsOptional()
  @IsIn(['id', 'en'])
  language?: string;

  @IsOptional()
  @IsBoolean()
  notifyApprovals?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyConflicts?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyReviews?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyTasks?: boolean;
}

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: any) {
    return this.users.getMe(user.id);
  }

  @Patch('me')
  update(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.id, dto);
  }
}
