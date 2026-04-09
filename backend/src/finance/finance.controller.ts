import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators';
import { FinanceService } from './finance.service';

@ApiTags('Finance')
@ApiBearerAuth()
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('stats')
  @ApiQuery({ name: 'period', required: false, enum: ['week', 'month', 'quarter', 'year'] })
  getStats(
    @CurrentUser('id') userId: string,
    @Query('period') period?: 'week' | 'month' | 'quarter' | 'year',
  ) {
    return this.financeService.getStats(userId, period);
  }

  @Get('summary')
  @ApiQuery({ name: 'period', required: false, enum: ['month', 'quarter', 'year'] })
  getSummary(
    @CurrentUser('id') userId: string,
    @Query('period') period?: 'month' | 'quarter' | 'year',
  ) {
    return this.financeService.getSummary(userId, period);
  }

  @Get('income-chart')
  @ApiQuery({ name: 'period', required: false, enum: ['week', 'month', 'quarter', 'year'] })
  getIncomeChart(
    @CurrentUser('id') userId: string,
    @Query('period') period?: 'week' | 'month' | 'quarter' | 'year',
  ) {
    return this.financeService.getIncomeChart(userId, period);
  }

  @Get('payment-methods')
  @ApiQuery({ name: 'period', required: false, enum: ['month', 'quarter', 'year'] })
  getPaymentMethods(
    @CurrentUser('id') userId: string,
    @Query('period') period?: 'month' | 'quarter' | 'year',
  ) {
    return this.financeService.getPaymentMethods(userId, period);
  }

  @Get('balances')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false })
  getBalances(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sort') sort?: string,
  ) {
    return this.financeService.getBalances(userId, { page, limit, sort });
  }

  @Get('income-by-students')
  @ApiQuery({ name: 'period', required: false, enum: ['month', 'quarter', 'year'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getIncomeByStudents(
    @CurrentUser('id') userId: string,
    @Query('period') period?: 'month' | 'quarter' | 'year',
    @Query('limit') limit?: number,
  ) {
    return this.financeService.getIncomeByStudents(userId, period, limit || 5);
  }
}
