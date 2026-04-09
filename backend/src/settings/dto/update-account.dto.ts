import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, IsBoolean } from 'class-validator';

export class UpdateAccountDto {
  @ApiPropertyOptional({ example: 'Анна Иванова' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '+79991234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '+79991234567' })
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @ApiPropertyOptional({ example: 'anna-ivanova' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'Europe/Moscow' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ example: ['Математика', 'Физика'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjects?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  subjectDetails?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aboutText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tagline?: string;

  @ApiPropertyOptional({ example: 'https://vk.com/user' })
  @IsOptional()
  @IsString()
  vk?: string;

  @ApiPropertyOptional({ example: 'https://my-site.ru' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ example: 'online' })
  @IsOptional()
  @IsString()
  format?: string;

  @ApiPropertyOptional({ example: 'Москва, м. Тверская' })
  @IsOptional()
  @IsString()
  offlineAddress?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
