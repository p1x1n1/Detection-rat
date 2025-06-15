import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Experiment } from '../experiment/experiment.entity';
import { Metric } from '../metric/metric.entity';

@Entity()
export class MetricExperiment {
  @PrimaryColumn({ type: 'int' })
  experimentId: number;

  @PrimaryColumn({ type: 'int' })
  metricId: number;

  @ManyToOne(() => Experiment, exp => exp.metricExperiments, {
    onDelete: 'CASCADE',
    eager: true
  })
  @JoinColumn({ name: 'experimentId' })
  experiment: Experiment;

  @ManyToOne(() => Metric, m => m.metricExperiments)
  @JoinColumn({ name: 'metricId' })
  metric: Metric;

  @Column({ type: 'int', nullable: true })
  startTime?: number;

  @Column({ type: 'int', nullable: true })
  endTime?: number;
}
