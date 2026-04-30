import {
  IsEmail,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  Length,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

const PASSWORD_REGEX = /^(?=.*[A-Za-zА-я])(?=.*\d).{8,}$/;
const PASSWORD_MSG = 'Пароль должен содержать минимум 8 символов, включая букву и цифру';

export enum RegistrationPlanId {
  START = 'start',
  PROFI = 'profi',
  CENTER = 'center',
}

export enum RegistrationBillingCycle {
  MONTH = 'month',
  YEAR = 'year',
}

export class RegisterConsentsDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  tutorOfferAccepted: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  tutorPersonalDataAccepted: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  tutorPublicationAccepted: boolean;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  marketingAccepted?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  tutorOfferText?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  tutorPersonalDataText?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  tutorPublicationText?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  marketingText?: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'Иван Петров' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'ivan@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MSG })
  password: string;

  @ApiProperty({ example: '+7 900 123-45-67', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiProperty({ required: false, example: 'legal_v1_2026-04-29' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  legalVersion?: string;

  @ApiProperty({ required: false, example: 'repeto_legal_v1_2026-04-29' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  legalDocumentHash?: string;

  @ApiProperty({ type: RegisterConsentsDto })
  @ValidateNested()
  @Type(() => RegisterConsentsDto)
  consents: RegisterConsentsDto;
}

export class RequestRegisterCodeDto extends RegisterDto {}

export class VerifyRegisterCodeDto {
  @ApiProperty({ example: 'ivan@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'Код должен состоять из 6 цифр' })
  code: string;
}

export class StartRegistrationPaymentDto {
  @ApiProperty()
  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  verificationToken: string;

  @ApiProperty({ enum: RegistrationPlanId })
  @IsEnum(RegistrationPlanId)
  planId: RegistrationPlanId;

  @ApiProperty({ enum: RegistrationBillingCycle })
  @IsEnum(RegistrationBillingCycle)
  billingCycle: RegistrationBillingCycle;
}

export class CompleteRegistrationDto extends StartRegistrationPaymentDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  paymentId?: string;
}

export class StartPlatformAccessPaymentDto {
  @ApiProperty({ enum: RegistrationPlanId, required: false })
  @IsOptional()
  @IsEnum(RegistrationPlanId)
  planId?: RegistrationPlanId;

  @ApiProperty({ enum: RegistrationBillingCycle, required: false })
  @IsOptional()
  @IsEnum(RegistrationBillingCycle)
  billingCycle?: RegistrationBillingCycle;
}

export class CompletePlatformAccessPaymentDto {
  @ApiProperty()
  @IsString()
  @MaxLength(200)
  paymentId: string;
}

export class LoginDto {
  @ApiProperty({ example: 'ivan@example.com' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MaxLength(128)
  password: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'ivan@example.com' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @MaxLength(500)
  token: string;

  @ApiProperty({ example: 'newpassword123' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MSG })
  password: string;
}
