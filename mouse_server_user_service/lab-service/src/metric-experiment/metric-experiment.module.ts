import { Module } from '@nestjs/common';
import { MetricExperimentService } from './metric-experiment.service';
import { MetricExperimentController } from './metric-experiment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetricExperiment } from './metric-experiment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MetricExperiment])],
  providers: [MetricExperimentService],
  controllers: [MetricExperimentController],
  exports: [MetricExperimentService, TypeOrmModule]
})
export class MetricExperimentModule { }