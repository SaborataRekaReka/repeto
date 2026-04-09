import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ConnectYandexCalendarTokenDto {
  @ApiProperty()
  @IsString()
  token: string;
}
