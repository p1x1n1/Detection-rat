import { ApiProperty } from '@nestjs/swagger';

export class CreateExperimentDto {
  @ApiProperty({ example: 'Experiment 1', description: 'Название эксперимента' })
  name: string;

  @ApiProperty({ example: 'Описание эксперимента', required: false })
  description?: string;

  @ApiProperty({ example: '2025-03-08', description: 'Дата начала эксперимента' })
  startDate: string;

  @ApiProperty({ example: '12:00:00', description: 'Время начала эксперимента' })
  startTime: string;

  @ApiProperty({ example: '2025-03-08', description: 'Дата завершения эксперимента' })
  endDate: string;

  @ApiProperty({ example: '12:30:00', description: 'Время завершения эксперимента' })
  endTime: string;

  @ApiProperty({ example: 'Комментарий', required: false, description: 'Дополнительная информация' })
  comment?: string;

  @ApiProperty({ example: 1, description: 'ID статуса эксперимента' })
  statusId: number;

  @ApiProperty({ example: 2, description: 'ID пользователя' })
  userId: number;

  @ApiProperty({ example: 3, description: 'ID лабораторного животного' })
  labAnimalId: number;

  @ApiProperty({ example: 3, description: 'ID видеозаписей' })
  videoIds: number[];

  metricExperiments: CreateMetricExperimentDto[];
}
export class CreateMetricExperimentDto {
  metricId:     number;
  startSeconds?: number;
  endSeconds?:   number;
}
