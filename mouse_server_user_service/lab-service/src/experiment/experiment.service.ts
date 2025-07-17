import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Experiment } from './experiment.entity';
import { CreateExperimentDto } from './dto/create-experiment.dto';
import { ClientProxy } from '@nestjs/microservices';
import { VideoExperiment } from 'src/video-experiment/video-experiment.entity';
import { MetricExperiment } from 'src/metric-experiment/metric-experiment.entity';
import { MetricVideoExperiment } from 'src/metric-video-experiment/metric-video-experiment.entity';
import { VideoService } from 'src/video/video.service';
import { Status } from 'src/status/status.entity';
import { lastValueFrom } from 'rxjs';
import * as path from 'path';
import { JwtUserPayload } from 'src/auth/jwt.strategy';
import { AnalyzeProccessed, AnalyzedError, AnalyzeResult } from './dto/analyze-result.dto';

@Injectable()
export class ExperimentService {
  constructor(
    @InjectRepository(Experiment)
    private readonly experimentRepository: Repository<Experiment>,
    @InjectRepository(VideoExperiment)
    private readonly videoExperimentRepository: Repository<VideoExperiment>,
    @InjectRepository(MetricExperiment)
    private readonly metricExperimentRepository: Repository<MetricExperiment>,
    @InjectRepository(MetricVideoExperiment)
    private readonly metricVideoExperimentRepository: Repository<MetricVideoExperiment>,
    @InjectRepository(Status)
    private readonly statusRepository: Repository<Status>,
    private readonly videoService: VideoService,

    @Inject('VIDEO_ANALYSIS_CLIENT')
    private readonly client: ClientProxy,
  ) { }

  async createExperiment(dto: CreateExperimentDto, user: JwtUserPayload): Promise<Experiment> {
    const { videoIds, metricExperiments, ...experimentData } = dto;

    const statusCreated = await this.statusRepository.findOneBy({ statusName: 'Создан' });
    if (!statusCreated) throw new Error('Статус "Создан" не найден');

    const experiment = this.experimentRepository.create({
      ...experimentData,
      status: statusCreated,
      user: { login: user.login },
    });
    const saved = await this.experimentRepository.save(experiment);

    const statusParticipating = await this.statusRepository.findOneBy({ statusName: 'Участвует в эксперименте' });

    for (const videoId of videoIds) {
      await this.videoExperimentRepository.save({
        experiment: saved,
        video: { id: videoId },
        status: statusParticipating,
      });
    }

    for (const me of metricExperiments) {
      await this.metricExperimentRepository.save({
        experiment: saved,
        metric: { id: me.metricId },
        startTime: me.startSeconds,
        endTime: me.endSeconds,
      });
    }

    return saved;
  }

  async getAllExperiments(user: JwtUserPayload): Promise<Experiment[]> {
    return this.experimentRepository.find({
      where: { user: { login: user.login } },
      relations: [
        'status',
        'user',
        'videoExperiments.status',
        'videoExperiments.video.labAnimal',
        'videoExperiments',
        'videoExperiments.video',
        'metricExperiments',
        'metricExperiments.metric',
      ],
    });
  }

  async getExperimentById(id: number, user: JwtUserPayload): Promise<Experiment> {
    const experiment = await this.experimentRepository.findOne({
      where: { id },
      relations: [
        'status',
        'user',
        'videoExperiments.video.labAnimal',
        'videoExperiments',
        'videoExperiments.video',
        'videoExperiments.status',
        'metricExperiments',
        'metricExperiments.metric',
        'metricVideoExperiments',
        'metricVideoExperiments.metric',
        'metricVideoExperiments.videoExperiment',
      ],
    });

    if (!experiment) throw new NotFoundException(`Эксперимент с id=${id} не найден`);
    if (experiment.user?.login !== user.login) throw new ForbiddenException('Нет доступа к эксперименту');

    return experiment;
  }

  async deleteExperiment(id: number, user: JwtUserPayload): Promise<void> {
    const experiment = await this.getExperimentById(id, user);
    await this.experimentRepository.remove(experiment);
  }

  async analyze(id: number, user: JwtUserPayload) {
    const exp = await this.getExperimentById(id, user);

    const status = await this.statusRepository.findOneBy({ statusName: 'Анализ' });
    if (status) {
      exp.status = status;
      await this.experimentRepository.save(exp);
    }

    const statusQueued = await this.statusRepository.findOneBy({ statusName: 'В очереди' });
    if (statusQueued) {
      const videoExperiments = await this.videoExperimentRepository.find({
        where: { experiment: { id } },
        relations: ['video'],
      });

      for (const ve of videoExperiments) {
        ve.status = statusQueued;
        await this.videoExperimentRepository.save(ve);
      }
    }

    await lastValueFrom(this.client.emit('video.analyze', { exp }));
    return { status: 'queued', exp };
  }

  async stopAnalyze(id: number, user: JwtUserPayload) {
    const exp = await this.getExperimentById(id, user);

    const status = await this.statusRepository.findOneBy({ statusName: 'Анализ прекращен' });
    if (status) {
      exp.status = status;
      await this.experimentRepository.save(exp);
    }

    const videoExperiments = await this.videoExperimentRepository.find({
      where: { experiment: { id } },
      relations: ['video'],
    });

    for (const ve of videoExperiments) {
      ve.status = status;
      await this.videoExperimentRepository.save(ve);
    }

    await lastValueFrom(this.client.emit('video.analyze.stopped', { exp }));
    return { status: 'queued', exp };
  }

  async analyzedProccesed(data: AnalyzeProccessed) {
    const rawFilename = data.videoPath.split(/[/\\]/).pop();
    const fullFilename = `/static/videos/${rawFilename}`;

    const videoId = await this.videoService.getVideoIdByFilename(fullFilename);
    if (!videoId) throw new Error(`Video not found: ${fullFilename}`);

    const processingStatus = await this.statusRepository.findOneBy({ statusName: 'В процессе' });
    await this.videoExperimentRepository.update(
      { experiment: { id: data.expId }, video: { id: videoId } },
      { status: processingStatus }
    );
  }

  async analyzedError(data: AnalyzedError) {
    const rawFilename = data.videoPath.split(/[/\\]/).pop();
    const fullFilename = `/static/videos/${rawFilename}`;

    const videoId = await this.videoService.getVideoIdByFilename(fullFilename);
    if (!videoId) throw new Error(`Video not found: ${fullFilename}`);

    const errorStatus = await this.statusRepository.findOneBy({ statusName: 'Ошибка во время выполнения' });
    await this.videoExperimentRepository.update(
      { experiment: { id: data.expId }, video: { id: videoId } },
      { status: errorStatus }
    );
  }

  async saveAnalyzedResult(data: AnalyzeResult): Promise<void> {
    const { expId, videoPath, metrics } = data;

    const rawFilename = videoPath.split(/[/\\]/).pop();
    const fullFilename = `/static/videos/${rawFilename}`;

    const parsedName = path.parse(rawFilename);
    // const resultFilename = `${parsedName.name}_${expId}_result${parsedName.ext}`;
    const resultFilename = `${parsedName.name}_${expId}_result.mp4`;
    const fullFilenameResult = `/static/videos/${resultFilename}`;

    const videoId = await this.videoService.getVideoIdByFilename(fullFilename);
    if (!videoId) throw new Error(`Video not found: ${fullFilename}`);

    const videoExperiment = await this.videoExperimentRepository.findOne({ where: { videoId: videoId, experimentId: expId } });

    for (const metricKey in metrics) {
      const metricData = metrics[metricKey];
      await this.metricVideoExperimentRepository.save({
        experimentId: expId,
        videoExperiment,
        metricId: metricData.metricId,
        value: metricData.value,
        comment: metricData.comment,
      });
    }

    await this.videoExperimentRepository.update(
      { experiment: { id: expId }, video: { id: videoId } },
      { filenameResult: fullFilenameResult }
    );

    const completeStatus = await this.statusRepository.findOneBy({ statusName: 'Успешно завершено' });
    await this.videoExperimentRepository.update(
      { experiment: { id: expId }, video: { id: videoId } },
      { status: completeStatus }
    );

    const allVideos = await this.videoExperimentRepository.find({
      where: { experiment: { id: expId } },
      relations: ['status'],
    });

    const allCompleted = allVideos.every(ve => ve.status?.statusName === 'Успешно завершено');
    const hasFailures = allVideos.some(ve => ve.status?.statusName === 'Ошибка');

    const exp = await this.experimentRepository.findOneBy({ id: expId });
    if (exp) {
      if (allCompleted) {
        const final = await this.statusRepository.findOneBy({ statusName: 'Успешно завершено' });
        exp.status = final;
      } else if (hasFailures) {
        const partial = await this.statusRepository.findOneBy({ statusName: 'Частично успешно' });
        exp.status = partial;
      }
      await this.experimentRepository.save(exp);
    }
  }
}
