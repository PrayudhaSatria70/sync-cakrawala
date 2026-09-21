import { Module } from '@nestjs/common';
import { ConflictsController } from './conflicts.controller';
import { ConflictsService } from './conflicts.service';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AuditModule, NotificationsModule],
  controllers: [ConflictsController],
  providers: [ConflictsService],
})
export class ConflictsModule {}
