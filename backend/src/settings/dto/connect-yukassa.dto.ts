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

  @ApiProperty({
    example: 'payment_method_token',
    description: 'Токен/идентификатор платёжного средства или реквизиты для выбранного способа выплаты',
  })
  @IsString()
  @MaxLength(2000)
  payoutDetails: string;

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
