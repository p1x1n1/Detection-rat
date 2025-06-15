import { Controller, Get, Post, Param, Body, Patch, Delete } from '@nestjs/common';
import { MetricVideoExperimentService } from './metric-video-experiment.service';
import { MetricVideoExperiment } from './metric-video-experiment.entity';

@Controller('metric-video-experiment')
export class MetricVideoExperimentController {
    constructor(private readonly service: MetricVideoExperimentService) { }

    @Get()
    findAll(): Promise<MetricVideoExperiment[]> {
        return this.service.findAll();
    }

    @Get(':experimentId/:videoId/:metricId')
    findOne(
        @Param('experimentId') experimentId: number,
        @Param('videoId') videoId: number,
        @Param('metricId') metricId: number,
    ): Promise<MetricVideoExperiment | null> {
        return this.service.findOne(experimentId, videoId, metricId);
    }

    @Get(':experimentId/:videoId')
    findOnebyExpVideo(
        @Param('experimentId') experimentId: number,
        @Param('videoId') videoId: number,
    ): Promise<MetricVideoExperiment | null> {
        return this.service.findOnebyExpVideo(experimentId, videoId);
    }

    @Post()
    create(@Body() data: Partial<MetricVideoExperiment>): Promise<MetricVideoExperiment> {
        return this.service.create(data);
    }

    @Patch(':experimentId/:videoId/:metricId')
    update(
        @Param('experimentId') experimentId: number,
        @Param('videoId') videoId: number,
        @Param('metricId') metricId: number,
        @Body() updates: Partial<MetricVideoExperiment>,
    ): Promise<MetricVideoExperiment> {
        return this.service.update(experimentId, videoId, metricId, updates);
    }

    @Delete(':experimentId/:videoId/:metricId')
    delete(
        @Param('experimentId') experimentId: number,
        @Param('videoId') videoId: number,
        @Param('metricId') metricId: number,
    ): Promise<void> {
        return this.service.delete(experimentId, videoId, metricId);
    }
}
