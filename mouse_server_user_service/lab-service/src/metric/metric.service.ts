import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Metric } from './metric.entity';
import { MetricExperiment } from '../metric-experiment/metric-experiment.entity';
import { CreateMetricDto } from './dto/create-metric.dto';
import { CreateMetricExperimentDto } from '../metric-experiment/dto/create-metric-experiment.dto';

@Injectable()
export class MetricService {
  constructor(
    @InjectRepository(Metric)
    private readonly metricRepository: Repository<Metric>,

    @InjectRepository(MetricExperiment)
    private readonly metricExperimentRepository: Repository<MetricExperiment>,
  ) {}

  async createMetric(dto: CreateMetricDto): Promise<Metric> {
    const metric = this.metricRepository.create(dto);
    return this.metricRepository.save(metric);
  }

  async getAllMetrics(): Promise<Metric[]> {
    return this.metricRepository.find();
  }

  async getMetricById(id: number): Promise<Metric | null> {
    return this.metricRepository.findOne({ where: { id } });
  }

  async deleteMetric(id: number): Promise<void> {
    await this.metricRepository.delete(id);
  }

  //maybe move it metric-expriment
  async addMetricToExperiment(dto: CreateMetricExperimentDto): Promise<MetricExperiment> {
    const metricExperiment = this.metricExperimentRepository.create(dto);
    return this.metricExperimentRepository.save(metricExperiment);
  }
}
