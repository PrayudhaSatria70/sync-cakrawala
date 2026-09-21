import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { autoSeedIfEmpty } from './seed.util';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    await autoSeedIfEmpty(this);
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
