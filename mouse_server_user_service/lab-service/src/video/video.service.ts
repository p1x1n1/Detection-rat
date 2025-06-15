import {
  Injectable,
  NotFoundException,
  ForbiddenException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';

import { Video } from './video.entity';
import { Experiment } from 'src/experiment/experiment.entity';
import { CreateVideoDto } from './dto/create-video.dto';
import { JwtUserPayload } from 'src/auth/jwt.strategy';

const ffprobeStatic = require('ffprobe-static');
const execFileAsync = promisify(execFile);

@Injectable()
export class VideoService {
  private readonly uploadDir = path.join(process.cwd(), 'static', 'videos');

  constructor(
    @InjectRepository(Video)
    private readonly videoRepo: Repository<Video>,
    @InjectRepository(Experiment)
    private readonly expRepo: Repository<Experiment>,
  ) {}

  async createVideo(dto: CreateVideoDto, fileUrl: string, user: JwtUserPayload): Promise<Video> {
    const fileName = path.basename(fileUrl);
    const filePath = path.join(this.uploadDir, fileName);

    const { stdout } = await execFileAsync(
      ffprobeStatic.path,
      ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nk=1:nw=1', filePath]
    );
    const durationSec = parseFloat(stdout);

    const video = this.videoRepo.create({
      ...dto,
      filename: fileUrl,
      durationMinutes: Math.floor(durationSec / 60),
      durationSeconds: Math.floor(durationSec % 60),
      isExperimentAnimal: dto.isExperimentAnimal ?? false,
      labAnimal: dto.labAnimalId ? { id: dto.labAnimalId } : null,
      user: { login: user.login }, // если доступен id, лучше использовать { id: user.id }
    });

    return this.videoRepo.save(video);
  }

  async getAllVideos(user: JwtUserPayload): Promise<Video[]> {
    return this.videoRepo.find({
      where: { user: { login: user.login } },
      relations: ['labAnimal', 'labAnimal.color'],
    });
  }

  async getVideoById(id: number, user: JwtUserPayload): Promise<Video | null> {
    const video = await this.videoRepo.findOne({
      where: { id },
      relations: ['labAnimal', 'labAnimal.color', 'videoExperiments', 'videoExperiments.experiment.status', 'user'],
    });

    if (!video) throw new NotFoundException(`Видео с id=${id} не найдено`);
    if (video.user?.login !== user.login) throw new ForbiddenException('Нет доступа к этому видео');

    return video;
  }

  async getVideoIdByFilename(filename: string): Promise<number | null> {
    const video = await this.videoRepo.findOne({ where: { filename } });
    return video?.id ?? null;
  }

  async updateVideo(
    id: number,
    dto: Partial<CreateVideoDto>,
    fileUrl: string | undefined,
    user: JwtUserPayload
  ): Promise<Video> {
    const video = await this.getVideoById(id, user);

    if (fileUrl) {
      const oldPath = path.join(this.uploadDir, path.basename(video.filename));
      try {
        await fsPromises.unlink(oldPath);
      } catch (e) {
        console.warn(`Не удалось удалить старое видео: ${oldPath}`);
      }

      const fullNewPath = path.join(this.uploadDir, path.basename(fileUrl));
      const { stdout } = await execFileAsync(ffprobeStatic.path, [
        '-v', 'error', '-show_entries', 'format=duration',
        '-of', 'default=nk=1:nw=1', fullNewPath
      ]);
      const durationSec = parseFloat(stdout);
      video.durationMinutes = Math.floor(durationSec / 60);
      video.durationSeconds = Math.floor(durationSec % 60);
      video.filename = fileUrl;
    }

    if (dto.description !== undefined) video.description = dto.description;
    if (dto.isExperimentAnimal !== undefined) video.isExperimentAnimal = dto.isExperimentAnimal;
    // if (dto.labAnimalId !== undefined) video.labAnimal = dto.labAnimalId ? { id: dto.labAnimalId } : null;

    return this.videoRepo.save(video);
  }

  async deleteVideo(id: number, user: JwtUserPayload): Promise<void> {
    const video = await this.getVideoById(id, user);

    const filePath = path.join(this.uploadDir, path.basename(video.filename));
    try {
      await fsPromises.unlink(filePath);
    } catch (e) {
      console.warn(`Не удалось удалить файл видео: ${filePath}`);
    }

    await this.videoRepo.delete(id);
  }
}
