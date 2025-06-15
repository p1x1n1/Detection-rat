import { MetricExperiment } from 'src/metric-experiment/metric-experiment.entity';
import { MetricVideoExperiment } from 'src/metric-video-experiment/metric-video-experiment.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity()
export class Metric {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  metricName: string;

  @Column({ default: false })
  isTimeMetric: boolean;

  @OneToMany(() => MetricExperiment, m => m.metric)
  metricExperiments: MetricExperiment[];

  @OneToMany(() => MetricVideoExperiment, m => m.metric)
  metricVideoExperiments: MetricVideoExperiment[];
}
