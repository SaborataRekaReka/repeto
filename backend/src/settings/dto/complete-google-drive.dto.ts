import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CompleteGoogleDriveDto {
  @ApiProperty()
  @IsString()
  code: string;
}
