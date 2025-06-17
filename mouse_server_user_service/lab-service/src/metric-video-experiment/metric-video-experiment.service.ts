import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MetricVideoExperiment } from './metric-video-experiment.entity';

@Injectable()
export class MetricVideoExperimentService {
    constructor(
        @InjectRepository(MetricVideoExperiment)
        private readonly repo: Repository<MetricVideoExperiment>,
    ) { }

    async findAll(): Promise<MetricVideoExperiment[]> {
        return this.repo.find({ relations: ['experiment', 'video', 'metric'] });
    }

    async findOne(experimentId: number, videoExperimentId: number, metricId: number): Promise<MetricVideoExperiment | null> {
        return this.repo.findOne({
            where: { experimentId, videoExperimentId, metricId },
            relations: ['experiment', 'video', 'metric'],
        });
    }
    async findOnebyExpVideo(experimentId: number, videoExperimentId: number): Promise<MetricVideoExperiment | null> {
        return this.repo.findOne({
            where: { experimentId, videoExperimentId },
            relations: ['experiment', 'video', 'metric'],
        });
    }


    async create(data: Partial<MetricVideoExperiment>): Promise<MetricVideoExperiment> {
        const entity = this.repo.create(data);
        return this.repo.save(entity);
    }

    async update(experimentId: number, videoExperimentId: number, metricId: number, updates: Partial<MetricVideoExperiment>): Promise<MetricVideoExperiment> {
        await this.repo.update({ experimentId, videoExperimentId, metricId }, updates);
        return this.findOne(experimentId, videoExperimentId, metricId);
    }

    async delete(experimentId: number, videoExperimentId: number, metricId: number): Promise<void> {
        await this.repo.delete({ experimentId, videoExperimentId, metricId });
    }
}
