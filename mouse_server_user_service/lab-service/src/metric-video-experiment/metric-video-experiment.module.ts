import { Module } from '@nestjs/common';
import { MetricVideoExperimentController } from './metric-video-experiment.controller';
import { MetricVideoExperimentService } from './metric-video-experiment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetricVideoExperiment } from './metric-video-experiment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MetricVideoExperiment])
  ],
  controllers: [MetricVideoExperimentController],
  providers: [MetricVideoExperimentService],
  exports: [MetricVideoExperimentService, TypeOrmModule]
})
export class MetricVideoExperimentModule { }
