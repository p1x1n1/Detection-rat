import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoExperimentController } from './video-experiment.controller';
import { VideoExperimentService } from './video-experiment.service';
import { VideoExperiment } from './video-experiment.entity';
import { StatusModule } from 'src/status/status.module';
import { VideoModule } from 'src/video/video.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VideoExperiment]),
    StatusModule,
    forwardRef(() => VideoModule),
  ],
  controllers: [VideoExperimentController],
  providers: [VideoExperimentService],
  exports: [VideoExperimentService, TypeOrmModule],
})
export class VideoExperimentModule {}
