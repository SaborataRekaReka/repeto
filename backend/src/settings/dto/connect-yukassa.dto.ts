import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaxStatus } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum TutorPayoutMethod {
  CARD = 'CARD',
  YOOMONEY = 'YOOMONEY',
  BANK_ACCOUNT = 'BANK_ACCOUNT',
}

export class ConnectYukassaDto {
  @ApiProperty({ enum: TaxStatus, example: TaxStatus.SELF_EMPLOYED })
  @IsEnum(TaxStatus)
  taxStatus: TaxStatus;

  @ApiProperty({ example: '123456789012' })
  @IsString()
  @MaxLength(20)
  taxInn: string;

  @ApiPropertyOptional({
    example: 'Иванов Иван Иванович',
    description: 'ФИО получателя или наименование организации',
  })
  @IsString()
  @MaxLength(160)
  taxDisplayName: string;

  @ApiProperty({ enum: TutorPayoutMethod, example: TutorPayoutMethod.CARD })
  @IsEnum(TutorPayoutMethod)
  payoutMethod: TutorPayoutMethod;

  @ApiPropertyOptional({
    example: 'pm_2e1f9d4a6c3b4f1a8d7c',
    description: 'Токен привязанного платёжного метода (без передачи полных карточных данных)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  paymentMethodToken?: string;

  @ApiPropertyOptional({
    example: 'pt_2e1f9d4a6c3b4f1a8d7c',
    description: 'Токен выплаты от провайдера',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  payoutToken?: string;

  @ApiPropertyOptional({
    example: 'CARD',
    description: 'Тип платёжного метода провайдера',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentMethodType?: string;

  @ApiPropertyOptional({
    example: '**** 1234',
    description: 'Маскированный PAN/последние 4 цифры карты',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  maskedPan?: string;

  @ApiPropertyOptional({
    example: '123456789012',
    description: 'ОГРНИП (для ИП)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  soleTraderOgrnip?: string;

  @ApiPropertyOptional({ example: '770101001' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  legalKpp?: string;

  @ApiPropertyOptional({ example: '1027700132195' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  legalOgrn?: string;

  @ApiPropertyOptional({ example: '40702810900000000001' })
  @IsOptional()
  @IsString()
  @MaxLength(34)
  legalCheckingAccount?: string;

  @ApiPropertyOptional({ example: '044525225' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  legalBik?: string;

  @ApiPropertyOptional({ example: 'АО БАНК ПРИМЕР' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  legalBankName?: string;

  @ApiPropertyOptional({ example: '30101810400000000225' })
  @IsOptional()
  @IsString()
  @MaxLength(34)
  legalCorrespondentAccount?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  paymentStatusConsentAccepted: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  paymentTermsAccepted: boolean;

  @ApiPropertyOptional({
    example: 'Подтверждаю налоговый статус и достоверность реквизитов.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  paymentStatusConsentText?: string;

  @ApiPropertyOptional({
    example: 'Принимаю условия приёма оплат через Repeto.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  paymentTermsConsentText?: string;

  @ApiPropertyOptional({ example: 'legal_v1_2026-04-29' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  legalVersion?: string;

  @ApiPropertyOptional({ example: 'repeto_legal_v1_2026-04-29' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  legalDocumentHash?: string;
}
