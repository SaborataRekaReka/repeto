import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  MaxLength,
  IsNumber,
  Min,
  IsOptional,
  IsEmail,
} from 'class-validator';

export class CreateStudentDto {
  @ApiProperty({ example: 'Иван Петров' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'Математика' })
  @IsString()
  @MaxLength(100)
  subject: string;

  @ApiProperty({ example: 2000, description: 'Ставка за занятие (руб)' })
  @IsNumber()
  @Min(0)
  rate: number;

  @ApiPropertyOptional({ example: '9 класс' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  grade?: string;

  @ApiPropertyOptional({ example: 15, description: 'Возраст ученика' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  age?: number;

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

  @ApiPropertyOptional({ example: 'student@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Мария Петрова' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  parentName?: string;

  @ApiPropertyOptional({ example: '+79997654321' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  parentPhone?: string;

  @ApiPropertyOptional({ example: '+79997654321' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  parentWhatsapp?: string;

  @ApiPropertyOptional({ example: 'parent@example.com' })
  @IsOptional()
  @IsEmail()
  parentEmail?: string;

  @ApiPropertyOptional({ example: 'Готовится к ОГЭ' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
