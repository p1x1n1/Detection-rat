import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MetricExperiment } from './metric-experiment.entity';
import { CreateMetricExperimentDto } from './dto/create-metric-experiment.dto';

@Injectable()
export class MetricExperimentService {
  constructor(
    @InjectRepository(MetricExperiment)
    private readonly repo: Repository<MetricExperiment>,
  ) { }

  async create(dto: CreateMetricExperimentDto): Promise<MetricExperiment> {
    const me = this.repo.create(dto);
    return this.repo.save(me);
  }

  async findAll(): Promise<MetricExperiment[]> {
    return this.repo.find();
  }

  async findOne(experimentId: number, metricId: number): Promise<MetricExperiment> {
    return this.repo.findOneOrFail({
      where: { experimentId, metricId },
    });
  }

  async update(
    experimentId: number,
    metricId: number,
    dto: Partial<CreateMetricExperimentDto>,
  ): Promise<MetricExperiment> {
    await this.repo.update({ experimentId, metricId }, dto);
    return this.findOne(experimentId, metricId);
  }

  async remove(experimentId: number, metricId: number): Promise<void> {
    await this.repo.delete({ experimentId, metricId });
  }

  formatSecondsToTime(seconds: number): string {
    const h = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  async getTimeWindowFormatted(experimentId: number, metricId: number): Promise<{ start: string | null; end: string | null }> {
    const record = await this.repo
      .createQueryBuilder('me')
      .select(['me.startTime', 'me.endTime'])
      .where('me.experimentId = :experimentId', { experimentId })
      .andWhere('me.metricId = :metricId', { metricId })
      .getOne();

    if (!record) {
      return { start: null, end: null };
    }

    const formatSecondsToTime = (seconds: number): string => {
      const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
      const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
      const s = Math.floor(seconds % 60).toString().padStart(2, '0');
      return `${h}:${m}:${s}`;
    };

    return {
      start: record.startTime != null ? formatSecondsToTime(record.startTime) : null,
      end: record.endTime != null ? formatSecondsToTime(record.endTime) : null,
    };
  }
}

