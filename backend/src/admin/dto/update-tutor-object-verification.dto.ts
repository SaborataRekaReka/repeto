import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsString, MinLength } from 'class-validator';
import { QUALIFICATION_OBJECT_TYPES, type QualificationObjectType } from '../../common/utils/qualification-verification';

export class UpdateTutorObjectVerificationDto {
  @ApiProperty({ enum: QUALIFICATION_OBJECT_TYPES, example: 'education' })
  @IsIn(QUALIFICATION_OBJECT_TYPES)
  type!: QualificationObjectType;

  @ApiProperty({ example: 'edu_2a7e970f67b1' })
  @IsString()
  @MinLength(1)
  objectId!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  verified!: boolean;
}
