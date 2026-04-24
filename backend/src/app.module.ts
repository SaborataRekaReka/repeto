import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { APP_GUARD } from '@nestjs/core';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { StudentsModule } from './students/students.module';
import { LessonsModule } from './lessons/lessons.module';
import { PaymentsModule } from './payments/payments.module';
import { PackagesModule } from './packages/packages.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { FinanceModule } from './finance/finance.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SettingsModule } from './settings/settings.module';
import { ProfileModule } from './profile/profile.module';
import { PortalModule } from './portal/portal.module';
import { PublicModule } from './public/public.module';
import { HealthModule } from './health/health.module';
import { AvailabilityModule } from './availability/availability.module';
import { FilesModule } from './files/files.module';
import { MessengerModule } from './messenger/messenger.module';
import { StudentAuthModule } from './student-auth/student-auth.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ThrottlerModule.forRoot(
      process.env.NODE_ENV === 'production'
        ? [
            { name: 'global', ttl: 60000, limit: 600 },
            { name: 'auth', ttl: 60000, limit: 10 },
            { name: 'portal', ttl: 60000, limit: 15 },
          ]
        : [
            { name: 'global', ttl: 60000, limit: 1000 },
            { name: 'auth', ttl: 60000, limit: 100 },
            { name: 'portal', ttl: 60000, limit: 100 },
          ],
    ),
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: { index: false },
    }),
    PrismaModule,
    AuthModule,
    StudentAuthModule,
    StudentsModule,
    LessonsModule,
    PaymentsModule,
    PackagesModule,
    DashboardModule,
    FinanceModule,
    NotificationsModule,
    SettingsModule,
    FilesModule,
    ProfileModule,
    PortalModule,
    PublicModule,
    HealthModule,
    AvailabilityModule,
    MessengerModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
