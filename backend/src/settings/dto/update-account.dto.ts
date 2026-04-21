import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, IsBoolean, MaxLength, IsEnum } from 'class-validator';
import { CloudProvider } from '@prisma/client';

export class UpdateAccountDto {
  @ApiPropertyOptional({ example: 'Анна Иванова' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: '+79991234567' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: '+79991234567' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  whatsapp?: string;

  @ApiPropertyOptional({
    example: 'СБП: +79991234567\nКарта: 2200 1234 5678 9567\nПолучатель: Иванов И.И.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  paymentRequisites?: string;

  @ApiPropertyOptional({ example: '2200 1234 5678 9567' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  paymentCardNumber?: string;

  @ApiPropertyOptional({ example: '+7 999 123-45-67' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  paymentSbpPhone?: string;

  @ApiPropertyOptional({ example: 'anna-ivanova' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  slug?: string;

  @ApiPropertyOptional({ example: 'Europe/Moscow' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;

  @ApiPropertyOptional({ example: ['Математика', 'Физика'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  subjects?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  subjectDetails?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  aboutText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  tagline?: string;

  @ApiPropertyOptional({ example: 'https://vk.com/user' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  vk?: string;

  @ApiPropertyOptional({ example: 'https://my-site.ru' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;

  @ApiPropertyOptional({ example: 'online' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  format?: string;

  @ApiPropertyOptional({ example: 'Москва, м. Тверская' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  offlineAddress?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  showPublicPackages?: boolean;

  @ApiPropertyOptional({ enum: CloudProvider, example: CloudProvider.YANDEX_DISK })
  @IsOptional()
  @IsEnum(CloudProvider)
  homeworkDefaultCloud?: CloudProvider;

  @ApiPropertyOptional({ description: 'Education entries (JSON array)' })
  @IsOptional()
  education?: any;

  @ApiPropertyOptional({ description: 'Experience text' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  experience?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  qualificationVerified?: boolean;

  @ApiPropertyOptional({ example: 'Диплом с отличием' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  qualificationLabel?: string;

  @ApiPropertyOptional({ description: 'Certificates (JSON array)' })
  @IsOptional()
  certificates?: any;
}
