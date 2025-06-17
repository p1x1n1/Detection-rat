import {
  Controller, Get, Post, Delete, Body, Param,
  HttpStatus, HttpCode, Res, ParseIntPipe, UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ExperimentService } from './experiment.service';
import { CreateExperimentDto } from './dto/create-experiment.dto';
import { Experiment } from './experiment.entity';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AnalyzedError, AnalyzeProccessed, AnalyzeResult } from './dto/analyze-result.dto';
import * as Excel from 'exceljs';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser, JwtUserPayload } from 'src/auth/jwt.strategy';

@ApiTags('Experiment')
@Controller('experiment')
export class ExperimentController {
  constructor(private readonly experimentService: ExperimentService) {}

  @ApiOperation({ summary: 'Создать эксперимент' })
  @ApiResponse({ status: 201, description: 'Эксперимент создан', type: Experiment })
  @UseGuards(AuthGuard('jwt'))
  @Post()
  createExperiment(
    @Body() dto: CreateExperimentDto,
    @CurrentUser() user: JwtUserPayload
  ): Promise<Experiment> {
    return this.experimentService.createExperiment(dto, user);
  }

  @ApiOperation({ summary: 'Получить все эксперименты' })
  @ApiResponse({ status: 200, description: 'Список экспериментов', type: [Experiment] })
  @UseGuards(AuthGuard('jwt'))
  @Get()
  getAllExperiments(@CurrentUser() user: JwtUserPayload): Promise<Experiment[]> {
    return this.experimentService.getAllExperiments(user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/report/excel')
  async downloadReport(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
    @CurrentUser() user: JwtUserPayload
  ) {
    const exp = await this.experimentService.getExperimentById(id, user);
    const videoExps = exp.videoExperiments || [];
    const metricVideoExps = exp.metricVideoExperiments || [];

    const metricNames = Array.from(
      new Set(metricVideoExps.map(mv => mv.metric.metricName))
    );

    const wb = new Excel.Workbook();
    const ws = wb.addWorksheet('Report');

    const header = ['Тип мыши', 'Видео', 'Имя животного', 'Вес (г)', 'Пол', ...metricNames];
    ws.addRow(header);

    for (const ve of videoExps) {
      const isExp = ve.video.isExperimentAnimal === true;
      const type = isExp ? 'Экспериментальная' : 'Контрольная';

      const row = [
        type,
        ve.video.name,
        ve.video.labAnimal?.name || '',
        ve.video.labAnimal?.weight ?? '',
        ve.video.labAnimal ? (ve.video.labAnimal.sex ? 'Самец ♂' : 'Самка ♀') : '',
        ...metricNames.map(name => {
          const mv = metricVideoExps.find(
            m => m.videoExperimentId === ve.videoId && m.metric.metricName === name
          );
          return mv ? mv.value : 0;
        }),
      ];
      ws.addRow(row);
    }

    ws.columns.forEach(col => {
      let maxLength = 10;
      col.eachCell({ includeEmpty: true }, cell => {
        const v = (cell.value ?? '').toString();
        if (v.length > maxLength) maxLength = v.length;
      });
      col.width = maxLength + 2;
    });

    const buffer = await wb.xlsx.writeBuffer();
    res.status(HttpStatus.OK).set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="experiment-${id}-report.xlsx"`,
    }).send(buffer);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  getExperimentById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUserPayload
  ): Promise<Experiment | null> {
    return this.experimentService.getExperimentById(id, user);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  deleteExperiment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUserPayload
  ): Promise<void> {
    return this.experimentService.deleteExperiment(id, user);
  }

  @Get('analyze/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Запустить анализ видео' })
  analyze(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUserPayload
  ) {
    return this.experimentService.analyze(id, user);
  }

  @Get('analyze/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Запустить анализ видео' })
  stopAnalyze(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUserPayload
  ) {
    return this.experimentService.analyze(id, user);
  }

  @EventPattern('video.analyze.completed')
  handleCompleted(@Payload() data: AnalyzeResult) {
    this.experimentService.saveAnalyzedResult(data);
  }

  @EventPattern('video.analyze.processed')
  handleProcessed(@Payload() data: AnalyzeProccessed) {
    this.experimentService.analyzedProccesed(data);
  }

  @EventPattern('video.analyze.error')
  handleError(@Payload() data: AnalyzedError) {
    this.experimentService.analyzedError(data);
  }
}
