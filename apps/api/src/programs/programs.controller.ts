import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { ProgramsService } from './programs.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class ProgramDto {
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() ownerDivisionId?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() startDate?: string;
  @IsOptional() @IsString() endDate?: string;
}

@Controller('programs')
@UseGuards(AuthGuard)
export class ProgramsController {
  constructor(private programs: ProgramsService) {}

  @Get()
  list(@CurrentUser() user: any) {
    return this.programs.list(user);
  }

  @Get(':id')
  get(@CurrentUser() user: any, @Param('id') id: string) {
    return this.programs.get(user, id);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: ProgramDto) {
    return this.programs.create(user, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: ProgramDto) {
    return this.programs.update(user, id, dto);
  }
}
