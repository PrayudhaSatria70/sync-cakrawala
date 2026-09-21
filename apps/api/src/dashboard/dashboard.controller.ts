import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '../common/guards/auth.guard';

@Controller('dashboard')
@UseGuards(AuthGuard)
export class DashboardController {
  constructor(private dashboard: DashboardService) {}

  @Get()
  summary() {
    return this.dashboard.summary();
  }
}
