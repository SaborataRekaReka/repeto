import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.connectWithRetry();
  }

  private async connectWithRetry(retries = 5, delay = 2000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.$connect();
        this.logger.log('Database connected');
        return;
      } catch (error) {
        if (attempt === retries) {
          this.logger.error(
            `Failed to connect to database after ${retries} attempts`,
            error instanceof Error ? error.stack : error,
          );
          throw error;
        }
        this.logger.warn(
          `Database connection attempt ${attempt}/${retries} failed, retrying in ${delay}ms...`,
        );
        await new Promise((r) => setTimeout(r, delay));
        delay *= 2;
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
