import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class RequestStudentOtpDto {
  @IsEmail()
  email!: string;
}

export class VerifyStudentOtpDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 6)
  code!: string;
}
