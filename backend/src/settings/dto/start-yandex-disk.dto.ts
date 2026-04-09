import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class StartYandexDiskDto {
  @ApiPropertyOptional({
    example: '/Repeto',
    description: 'Папка на Яндекс.Диске, которая будет использоваться как корень материалов',
  })
  @IsOptional()
  @IsString()
  rootPath?: string;
}
