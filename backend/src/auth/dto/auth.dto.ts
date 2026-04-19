import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
