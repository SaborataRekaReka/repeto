import { Module } from '@nestjs/common';
import { LegalService } from './legal.service';

@Module({
  providers: [LegalService],
  exports: [LegalService],
})
export class LegalModule {}
