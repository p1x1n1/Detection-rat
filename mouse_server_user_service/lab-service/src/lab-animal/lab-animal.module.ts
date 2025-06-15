import { Module } from '@nestjs/common';
import { LabAnimalController } from './lab-animal.controller';
import { LabAnimalService } from './lab-animal.service';
import { LabAnimal } from './lab-animal.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileModule } from 'src/file/file.module';
import { VideoModule } from 'src/video/video.module';

@Module({
  imports: [TypeOrmModule.forFeature([LabAnimal]), FileModule, VideoModule],
  controllers: [LabAnimalController],
  providers: [LabAnimalService],
  exports: [LabAnimalService]
})
export class LabAnimalModule { }
