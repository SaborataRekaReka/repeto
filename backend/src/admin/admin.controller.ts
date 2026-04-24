import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';
import { UpdateTutorVerificationDto } from './dto/update-tutor-verification.dto';
import { UpdateTutorObjectVerificationDto } from './dto/update-tutor-object-verification.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('tutors')
  listTutors(
    @Query('search') search?: string,
    @Query('verified') verified?: string,
  ) {
    let verifiedBool: boolean | undefined;
    if (verified === 'true' || verified === '1') {
      verifiedBool = true;
    } else if (verified === 'false' || verified === '0') {
      verifiedBool = false;
    }

    return this.adminService.listTutors({ search, verified: verifiedBool });
  }

  @Get('tutors/:id')
  getTutorDetails(@Param('id', ParseUUIDPipe) tutorId: string) {
    return this.adminService.getTutorDetails(tutorId);
  }

  @Patch('tutors/:id/verification')
  updateTutorVerification(
    @Param('id', ParseUUIDPipe) tutorId: string,
    @Body() dto: UpdateTutorVerificationDto,
  ) {
    return this.adminService.updateTutorVerification(tutorId, dto.verified);
  }

  @Patch('tutors/:id/object-verification')
  updateTutorObjectVerification(
    @Param('id', ParseUUIDPipe) tutorId: string,
    @Body() dto: UpdateTutorObjectVerificationDto,
  ) {
    return this.adminService.updateTutorObjectVerification(
      tutorId,
      dto.type,
      dto.objectId,
      dto.verified,
    );
  }
}
