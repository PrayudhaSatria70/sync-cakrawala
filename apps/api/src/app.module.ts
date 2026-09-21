import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';
import { ProgramsModule } from './programs/programs.module';
import { TasksModule } from './tasks/tasks.module';
import { DocumentsModule } from './documents/documents.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { ConflictsModule } from './conflicts/conflicts.module';
import { AuditModule } from './audit/audit.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { StorageModule } from './storage/storage.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }]),
    PrismaModule,
    StorageModule,
    AuthModule,
    UsersModule,
    AdminModule,
    ProgramsModule,
    TasksModule,
    DocumentsModule,
    ReviewsModule,
    ApprovalsModule,
    ConflictsModule,
    AuditModule,
    NotificationsModule,
    DashboardModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
