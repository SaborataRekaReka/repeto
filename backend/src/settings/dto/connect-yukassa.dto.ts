import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ConnectYukassaDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  shopId: string;

  @ApiProperty({ example: 'test_secret_key' })
  @IsString()
  secretKey: string;
}
