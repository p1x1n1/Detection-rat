import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    ParseIntPipe,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { VideoExperimentService } from './video-experiment.service';
import { CreateVideoExperimentDto } from './dto/create-video-experiment.dto';
import { VideoExperiment } from './video-experiment.entity';

@Controller('video-experiment')
export class VideoExperimentController {
    constructor(private readonly service: VideoExperimentService) { }

    @Post()
    async create(
        @Body() dto: CreateVideoExperimentDto,
    ): Promise<VideoExperiment> {
        return this.service.create(dto);
    }

    @Get()
    async findAll(): Promise<VideoExperiment[]> {
        return this.service.findAll();
    }

    @Get(':experimentId/:videoId')
    async findOne(
        @Param('experimentId', ParseIntPipe) experimentId: number,
        @Param('videoId', ParseIntPipe) videoId: number,
    ): Promise<VideoExperiment> {
        return this.service.findOne(experimentId, videoId);
    }

    @Delete(':experimentId/:videoId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(
        @Param('experimentId', ParseIntPipe) experimentId: number,
        @Param('videoId', ParseIntPipe) videoId: number,
    ): Promise<void> {
        return this.service.remove(experimentId, videoId);
    }
}
