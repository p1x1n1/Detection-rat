import { Module } from '@nestjs/common';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';
import { Video } from './video.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Experiment } from 'src/experiment/experiment.entity';
import { FileModule } from 'src/file/file.module';
import { VideoExperimentModule } from 'src/video-experiment/video-experiment.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Video, Experiment]),
    FileModule,
    VideoExperimentModule
  ],
  controllers: [VideoController],
  providers: [VideoService],
  exports: [VideoService]
})
export class VideoModule { }
