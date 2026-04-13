import { IsEmail, IsOptional, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const PASSWORD_REGEX = /^(?=.*[A-Za-zА-я])(?=.*\d).{8,}$/;
const PASSWORD_MSG = 'Пароль должен содержать минимум 8 символов, включая букву и цифру';

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

export class LoginDto {
  @ApiProperty({ example: 'ivan@example.com или +79001234567' })
  @IsString()
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
