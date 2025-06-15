import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { MetricService } from './metric.service';
import { CreateMetricDto } from './dto/create-metric.dto';
import { CreateMetricExperimentDto } from '../metric-experiment/dto/create-metric-experiment.dto';
import { Metric } from './metric.entity';
import { MetricExperiment } from '../metric-experiment/metric-experiment.entity';

@Controller('metric')
export class MetricController {
  constructor(private readonly metricService: MetricService) { }

  @Post()
  createMetric(@Body() dto: CreateMetricDto): Promise<Metric> {
    return this.metricService.createMetric(dto);
  }

  @Get()
  async getAllMetrics(): Promise<Metric[]> {
    // const metrics = await this.metricService.getAllMetrics();
    // console.log('getAllMetrics:', metrics);
    return await this.metricService.getAllMetrics();
  }

  @Get(':id')
  getMetricById(@Param('id') id: number): Promise<Metric | null> {
    return this.metricService.getMetricById(id);
  }

  @Delete(':id')
  deleteMetric(@Param('id') id: number): Promise<void> {
    return this.metricService.deleteMetric(id);
  }

  @Post('experiment')
  addMetricToExperiment(@Body() dto: CreateMetricExperimentDto): Promise<MetricExperiment> {
    return this.metricService.addMetricToExperiment(dto);
  }
}
