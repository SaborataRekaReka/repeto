import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { Public } from '../common/decorators';
import { PublicService } from './public.service';

@ApiTags('Public')
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Public()
  @Get('tutors/:slug')
  getTutorProfile(@Param('slug') slug: string) {
    return this.publicService.getTutorProfile(slug);
  }

  @Public()
  @Get('tutors/:slug/slots')
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getTutorSlots(
    @Param('slug') slug: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.publicService.getTutorSlots(slug, from, to);
  }

  @Public()
  @Post('tutors/:slug/book')
  createBooking(
    @Param('slug') slug: string,
    @Body()
    body: {
      subject: string;
      date: string;
      startTime: string;
      clientName: string;
      clientPhone: string;
      clientEmail?: string;
      comment?: string;
    },
  ) {
    return this.publicService.createBooking(slug, body);
  }
}
