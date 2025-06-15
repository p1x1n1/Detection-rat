import { Module } from '@nestjs/common';
import { VideoExperimentService } from './video-experiment.service';
import { VideoExperimentController } from './video-experiment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoExperiment } from './video-experiment.entity';
import { StatusModule } from 'src/status/status.module';

@Module({
  imports: [TypeOrmModule.forFeature([VideoExperiment]), StatusModule],
  providers: [VideoExperimentService],
  controllers: [VideoExperimentController],
  exports: [VideoExperimentService, TypeOrmModule]
})
export class VideoExperimentModule {}
