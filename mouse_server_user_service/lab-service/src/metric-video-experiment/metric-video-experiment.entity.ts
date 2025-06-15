import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, PrimaryColumn, JoinColumn } from 'typeorm';
import { Experiment } from '../experiment/experiment.entity';
import { Video } from 'src/video/video.entity';
import { Status } from 'src/status/status.entity';
import { Metric } from 'src/metric/metric.entity';

@Entity()
export class MetricVideoExperiment {
    @PrimaryColumn('int')
    experimentId: number;

    @PrimaryColumn('int')
    videoId: number;

    @PrimaryColumn({ type: 'int' })
    metricId: number;

    @ManyToOne(() => Experiment, exp => exp.metricVideoExperiments, {
        onDelete: 'CASCADE',
        eager: true
      })
    @JoinColumn({ name: 'experimentId' })
    experiment: Experiment;

    @ManyToOne(() => Video, v => v.metricVideoExperiments)
    @JoinColumn({ name: 'videoId' })
    video: Video;

    @ManyToOne(() => Metric, m => m.metricVideoExperiments)
    @JoinColumn({ name: 'metricId' })
    metric: Metric;

    @Column({ type: 'float', nullable: true }) // precision можно убрать или использовать decimal, если важно
    value?: number;

    @Column({ type: 'text', nullable: true })
    comment?: string;
}
