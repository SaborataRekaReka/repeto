import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats(@CurrentUser('id') userId: string) {
    return this.dashboardService.getStats(userId);
  }

  @Get('today-lessons')
  getTodayLessons(@CurrentUser('id') userId: string) {
    return this.dashboardService.getTodayLessons(userId);
  }

  @Get('debts')
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getDebts(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.dashboardService.getDebts(userId, limit || 5);
  }

  @Get('recent-payments')
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getRecentPayments(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.dashboardService.getRecentPayments(userId, limit || 5);
  }

  @Get('income-chart')
  @ApiQuery({ name: 'period', required: false, enum: ['month', 'quarter', 'year'] })
  getIncomeChart(
    @CurrentUser('id') userId: string,
    @Query('period') period?: 'month' | 'quarter' | 'year',
  ) {
    return this.dashboardService.getIncomeChart(userId, period);
  }

  @Get('week-lessons')
  getWeekLessons(@CurrentUser('id') userId: string) {
    return this.dashboardService.getWeekLessons(userId);
  }

  @Get('conversion')
  @ApiQuery({ name: 'period', required: false, enum: ['month', 'quarter', 'year'] })
  getConversion(
    @CurrentUser('id') userId: string,
    @Query('period') period?: 'month' | 'quarter' | 'year',
  ) {
    return this.dashboardService.getConversion(userId, period);
  }

  @Get('expiring-packages')
  getExpiringPackages(@CurrentUser('id') userId: string) {
    return this.dashboardService.getExpiringPackages(userId);
  }
}
