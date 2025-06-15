// src/video-experiment/video-experiment.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VideoExperiment } from './video-experiment.entity';
import { CreateVideoExperimentDto } from './dto/create-video-experiment.dto';
import { Status } from 'src/status/status.entity';

@Injectable()
export class VideoExperimentService {
  constructor(
    @InjectRepository(VideoExperiment)
    private readonly repo: Repository<VideoExperiment>,
    @InjectRepository(Status)
    private readonly statusRepo: Repository<Status>,
  ) {}

  async create(dto: CreateVideoExperimentDto): Promise<VideoExperiment> {
    const ve = this.repo.create(dto);
    return this.repo.save(ve);
  }

  async findAll(): Promise<VideoExperiment[]> {
    return this.repo.find({ relations: ['experiment', 'video', 'status'] });
  }

  async findOne(experimentId: number, videoId: number): Promise<VideoExperiment> {
    return this.repo.findOneOrFail({
      where: { experimentId, videoId },
      relations: ['experiment', 'video', 'status'],
    });
  }

  async remove(experimentId: number, videoId: number): Promise<void> {
    await this.repo.delete({ experimentId, videoId });
  }

  async setStatus(experimentId: number, videoId: number, statusName: string): Promise<VideoExperiment> {
    const ve = await this.repo.findOne({
      where: { experimentId, videoId },
      relations: ['status'],
    });

    if (!ve) {
      throw new NotFoundException('VideoExperiment not found');
    }

    const status = await this.statusRepo.findOne({
      where: { statusName },
    });

    if (!status) {
      throw new NotFoundException(`Status "${statusName}" not found`);
    }

    ve.status = status;
    return this.repo.save(ve);
  }
}
