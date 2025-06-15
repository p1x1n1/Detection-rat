import { Module } from '@nestjs/common';
import { MetricService } from './metric.service';
import { MetricController } from './metric.controller';
import { Metric } from './metric.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetricExperiment } from 'src/metric-experiment/metric-experiment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Metric, MetricExperiment])],
  providers: [MetricService],
  controllers: [MetricController],
  exports: [MetricService]
})
export class MetricModule {}
