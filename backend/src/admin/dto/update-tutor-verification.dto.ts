import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateTutorVerificationDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  verified!: boolean;
}
