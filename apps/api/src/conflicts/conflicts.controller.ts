import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { ConflictsService } from './conflicts.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class ResolveDto {
  @IsString() decision: string;
  @IsOptional() @IsString() notes?: string;
}

@Controller('conflicts')
@UseGuards(AuthGuard)
export class ConflictsController {
  constructor(private conflicts: ConflictsService) {}

  @Get()
  list(@Query('status') status?: string) {
    return this.conflicts.list(status);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.conflicts.get(id);
  }

  @Post(':id/acknowledge')
  acknowledge(@CurrentUser() user: any, @Param('id') id: string) {
    return this.conflicts.acknowledge(user, id);
  }

  @Post(':id/resolve')
  resolve(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: ResolveDto) {
    return this.conflicts.resolve(user, id, dto.decision, dto.notes);
  }
}
