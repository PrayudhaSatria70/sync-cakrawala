import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, IsArray } from 'class-validator';
import { ApprovalsService } from './approvals.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class CreateApprovalDto {
  @IsString() title: string;
  @IsOptional() @IsString() summary?: string;
  @IsOptional() @IsString() subjectType?: string;
  @IsOptional() @IsString() subjectId?: string;
  @IsOptional() @IsString() riskLevel?: string;
  @IsOptional() @IsArray() steps?: any[];
}

class DecisionDto {
  @IsOptional() @IsString() comment?: string;
}

@Controller('approvals')
@UseGuards(AuthGuard)
export class ApprovalsController {
  constructor(private approvals: ApprovalsService) {}

  @Get()
  list(@Query('status') status?: string) {
    return this.approvals.list(status);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.approvals.get(id);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateApprovalDto) {
    return this.approvals.create(user, dto);
  }

  @Post(':id/approve')
  approve(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: DecisionDto) {
    return this.approvals.decide(user, id, 'APPROVED', dto.comment);
  }

  @Post(':id/return')
  returnApproval(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: DecisionDto) {
    return this.approvals.decide(user, id, 'RETURNED', dto.comment || 'Returned');
  }

  @Post(':id/reject')
  reject(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: DecisionDto) {
    return this.approvals.decide(user, id, 'REJECTED', dto.comment || 'Rejected');
  }
}
