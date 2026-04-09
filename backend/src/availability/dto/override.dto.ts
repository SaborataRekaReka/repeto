import { IsString, IsBoolean, IsOptional, IsArray, ValidateNested, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class OverrideSlotDto {
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  startTime: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  endTime: string;
}

export class SetOverrideDto {
  @IsBoolean()
  isBlocked: boolean; // true = day off, false = custom hours

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OverrideSlotDto)
  @IsOptional()
  slots?: OverrideSlotDto[]; // ignored when isBlocked=true
}
