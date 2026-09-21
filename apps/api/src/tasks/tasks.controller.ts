import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { TasksService } from './tasks.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class TaskDto {
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() programId?: string;
  @IsOptional() @IsString() divisionId?: string;
  @IsOptional() @IsString() assigneeId?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() priority?: string;
  @IsOptional() @IsString() dueDate?: string;
}

@Controller('tasks')
@UseGuards(AuthGuard)
export class TasksController {
  constructor(private tasks: TasksService) {}

  @Get()
  list(@CurrentUser() user: any, @Query('status') status?: string) {
    return this.tasks.list(user, status);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: TaskDto) {
    return this.tasks.create(user, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: Partial<TaskDto>) {
    return this.tasks.update(user, id, dto);
  }
}
