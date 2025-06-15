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

    async findOne(experimentId: number, videoId: number, metricId: number): Promise<MetricVideoExperiment | null> {
        return this.repo.findOne({
            where: { experimentId, videoId, metricId },
            relations: ['experiment', 'video', 'metric'],
        });
    }
    async findOnebyExpVideo(experimentId: number, videoId: number): Promise<MetricVideoExperiment | null> {
        return this.repo.findOne({
            where: { experimentId, videoId },
            relations: ['experiment', 'video', 'metric'],
        });
    }


    async create(data: Partial<MetricVideoExperiment>): Promise<MetricVideoExperiment> {
        const entity = this.repo.create(data);
        return this.repo.save(entity);
    }

    async update(experimentId: number, videoId: number, metricId: number, updates: Partial<MetricVideoExperiment>): Promise<MetricVideoExperiment> {
        await this.repo.update({ experimentId, videoId, metricId }, updates);
        return this.findOne(experimentId, videoId, metricId);
    }

    async delete(experimentId: number, videoId: number, metricId: number): Promise<void> {
        await this.repo.delete({ experimentId, videoId, metricId });
    }
}
