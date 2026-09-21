import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  check() {
    return { status: 'ok', service: 'sync-api', timestamp: new Date().toISOString() };
  }

  @Get()
  root() {
    return {
      service: 'SYNC Cakrawala Backend API',
      status: 'online',
      webUrl: 'http://localhost:3000',
      message: 'This is the backend REST API. Open http://localhost:3000 to access the SYNC Cakrawala web interface.',
    };
  }
}
