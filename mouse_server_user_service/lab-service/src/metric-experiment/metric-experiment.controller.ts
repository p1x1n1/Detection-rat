import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MetricExperimentService } from './metric-experiment.service';
import { CreateMetricExperimentDto } from './dto/create-metric-experiment.dto';
import { MetricExperiment } from './metric-experiment.entity';

@Controller('metric-experiment')
export class MetricExperimentController {
  constructor(private readonly metricExperimentService: MetricExperimentService) { }

  @Post()
  async create(
    @Body() dto: CreateMetricExperimentDto,
  ): Promise<MetricExperiment> {
    return this.metricExperimentService.create(dto);
  }

  @Get()
  async findAll(): Promise<MetricExperiment[]> {
    return this.metricExperimentService.findAll();
  }

  @Get(':experimentId/:metricId')
  async findOne(
    @Param('experimentId', ParseIntPipe) experimentId: number,
    @Param('metricId', ParseIntPipe) metricId: number,
  ): Promise<MetricExperiment> {
    return this.metricExperimentService.findOne(experimentId, metricId);
  }

  @Patch(':experimentId/:metricId')
  async update(
    @Param('experimentId', ParseIntPipe) experimentId: number,
    @Param('metricId', ParseIntPipe) metricId: number,
    @Body() dto: Partial<CreateMetricExperimentDto>,
  ): Promise<MetricExperiment> {
    return this.metricExperimentService.update(experimentId, metricId, dto);
  }

  @Delete(':experimentId/:metricId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('experimentId', ParseIntPipe) experimentId: number,
    @Param('metricId', ParseIntPipe) metricId: number,
  ): Promise<void> {
    return this.metricExperimentService.remove(experimentId, metricId);
  }

  @Get('window/:experimentId/:metricId')
  async getTimeWindowFormatted(
    @Param('experimentId') experimentId: number,
    @Param('metricId') metricId: number,
  ) {
    return this.metricExperimentService.getTimeWindowFormatted(experimentId, metricId);
  }
}
