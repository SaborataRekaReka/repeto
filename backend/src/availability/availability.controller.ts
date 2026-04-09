import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators';
import { AvailabilityService } from './availability.service';
import { SetAvailabilityDto, SetOverrideDto } from './dto';

@ApiTags('Availability')
@ApiBearerAuth()
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly service: AvailabilityService) {}

  @Get()
  getWeeklySlots(@CurrentUser('id') userId: string) {
    return this.service.getWeeklySlots(userId);
  }

  @Put()
  setWeeklySlots(
    @CurrentUser('id') userId: string,
    @Body() dto: SetAvailabilityDto,
  ) {
    return this.service.setWeeklySlots(userId, dto.slots);
  }

  // ── Overrides ──

  @Get('overrides')
  getOverrides(@CurrentUser('id') userId: string) {
    return this.service.getOverrides(userId);
  }

  @Put('overrides/:date')
  setOverride(
    @CurrentUser('id') userId: string,
    @Param('date') date: string,
    @Body() dto: SetOverrideDto,
  ) {
    return this.service.setOverrideForDate(userId, date, dto.isBlocked, dto.slots);
  }

  @Delete('overrides/:date')
  deleteOverride(
    @CurrentUser('id') userId: string,
    @Param('date') date: string,
  ) {
    return this.service.deleteOverrideForDate(userId, date);
  }
}
