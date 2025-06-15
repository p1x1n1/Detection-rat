import {
  Controller, Get, Post, Param, Body, UploadedFile,
  UseInterceptors, NotFoundException, ParseIntPipe,
  Patch, Delete, UseGuards
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VideoService } from './video.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { Video } from './video.entity';
import { FileService } from 'src/file/file.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser, JwtUserPayload } from 'src/auth/jwt.strategy';

@Controller('video')
@UseGuards(AuthGuard('jwt'))
export class VideoController {
  constructor(
    private readonly videoService: VideoService,
    private readonly fileService: FileService
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('video'))
  async create(
    @Body() dto: CreateVideoDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtUserPayload
  ): Promise<Video> {
    const videoPath = this.fileService.saveFile(file, 'static/videos');
    return this.videoService.createVideo(dto, videoPath, user);
  }

  @Get()
  async findAll(@CurrentUser() user: JwtUserPayload): Promise<Video[]> {
    return this.videoService.getAllVideos(user);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUserPayload
  ): Promise<Video> {
    const video = await this.videoService.getVideoById(id, user);
    if (!video) throw new NotFoundException(`Видео с id=${id} не найдено`);
    return video;
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: Partial<CreateVideoDto>,
    @CurrentUser() user: JwtUserPayload
  ): Promise<Video> {
    const filePath = file ? this.fileService.saveFile(file, 'static/videos') : undefined;
    return this.videoService.updateVideo(id, dto, filePath, user);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUserPayload
  ): Promise<void> {
    return this.videoService.deleteVideo(id, user);
  }
}
