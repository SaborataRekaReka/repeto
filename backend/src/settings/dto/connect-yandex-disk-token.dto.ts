import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ConnectYandexDiskTokenDto {
  @ApiProperty({
    example: 'y0_AgAAAABk...',
    description: 'OAuth-токен Яндекс.Диска',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiPropertyOptional({
    example: '/Материалы',
    description: 'Папка на Яндекс.Диске (корень материалов)',
  })
  @IsOptional()
  @IsString()
  rootPath?: string;
}
