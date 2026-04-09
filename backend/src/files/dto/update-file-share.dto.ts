import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class UpdateFileShareDto {
  @ApiProperty({
    type: [String],
    description: 'Список ID учеников, которым нужно дать доступ',
  })
  @IsArray()
  @IsUUID('4', { each: true })
  studentIds: string[];

  @ApiPropertyOptional({
    default: false,
    description: 'Если true и выбран элемент-папка, применяет доступ ко всем вложенным файлам и папкам',
  })
  @IsOptional()
  @IsBoolean()
  applyToChildren?: boolean;
}
