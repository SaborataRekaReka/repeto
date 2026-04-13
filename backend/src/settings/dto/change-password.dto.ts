import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

const PASSWORD_REGEX = /^(?=.*[A-Za-zА-я])(?=.*\d).{8,}$/;
const PASSWORD_MSG = 'Пароль должен содержать минимум 8 символов, включая букву и цифру';

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @MaxLength(128)
  currentPassword: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MSG })
  newPassword: string;
}
