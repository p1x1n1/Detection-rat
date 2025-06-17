import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Status } from '../status/status.entity';
import { User } from '../user/user.entity';
import { MetricExperiment } from 'src/metric-experiment/metric-experiment.entity';
import { VideoExperiment } from 'src/video-experiment/video-experiment.entity';
import { MetricVideoExperiment } from 'src/metric-video-experiment/metric-video-experiment.entity';

@Entity()
export class Experiment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'date' })
  endDate: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ nullable: true })
  comment?: string;

  @ManyToOne(() => Status, (status) => status.experiments)
  status: Status;

  @ManyToOne(() => User, (user) => user.experiments, {onDelete: 'CASCADE'})
  user: User;

  @OneToMany(() => MetricExperiment, exp => exp.experiment, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  metricExperiments: MetricExperiment[];
  
  @OneToMany(() => VideoExperiment, exp => exp.experiment, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  videoExperiments: VideoExperiment[];
  
  @OneToMany(() => MetricVideoExperiment, exp => exp.experiment, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  metricVideoExperiments: MetricVideoExperiment[];
}
