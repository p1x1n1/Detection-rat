import { Module } from '@nestjs/common';
import { ExperimentController } from './experiment.controller';
import { ExperimentService } from './experiment.service';
import { Experiment } from './experiment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MetricExperimentModule } from 'src/metric-experiment/metric-experiment.module';
import { VideoExperimentModule } from 'src/video-experiment/video-experiment.module';
import { VideoModule } from 'src/video/video.module';
import { MetricVideoExperimentModule } from 'src/metric-video-experiment/metric-video-experiment.module';
import { StatusModule } from 'src/status/status.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([Experiment]),
    ClientsModule.register([
      {
        name: 'VIDEO_ANALYSIS_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: [
            `amqp://guest:guest@localhost:5672`
          ],
          queue: 'video_analysis_queue',
          queueOptions: { durable: false },
        },
      },
    ]),
    MetricExperimentModule,
    VideoExperimentModule,
    MetricVideoExperimentModule,
    VideoModule,
    StatusModule
  ],
  controllers: [ExperimentController],
  providers: [ExperimentService],
  exports: [ExperimentService]
})
export class ExperimentModule {}
