import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CompleteGoogleCalendarDto {
  @ApiProperty()
  @IsString()
  code: string;
}
