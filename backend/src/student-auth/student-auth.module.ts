import { Module } from '@nestjs/common';
import { StudentAuthController } from './student-auth.controller';
import { StudentAuthService } from './student-auth.service';
import { StudentAuthGuard } from './student-auth.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [StudentAuthController],
  providers: [StudentAuthService, StudentAuthGuard],
  exports: [StudentAuthService, StudentAuthGuard],
})
export class StudentAuthModule {}
