import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';
import { Video } from './video.entity';
import { Experiment } from 'src/experiment/experiment.entity';
import { FileModule } from 'src/file/file.module';
import { VideoExperimentModule } from 'src/video-experiment/video-experiment.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Video, Experiment]),
    FileModule,
    forwardRef(() => VideoExperimentModule),
  ],
  controllers: [VideoController],
  providers: [VideoService],
  exports: [VideoService, TypeOrmModule],
})
export class VideoModule {}
