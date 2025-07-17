import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, PrimaryColumn, JoinColumn, OneToMany } from 'typeorm';
import { Experiment } from '../experiment/experiment.entity';
import { Video } from 'src/video/video.entity';
import { Status } from 'src/status/status.entity';
import { MetricVideoExperiment } from 'src/metric-video-experiment/metric-video-experiment.entity';

@Entity()
export class VideoExperiment {
  @PrimaryGeneratedColumn()
  videoExperimentId: number;

  @Column('int')
  experimentId: number;

  @Column('int', { nullable: true })
  videoId: number;

  @Column({ nullable: true })
  filenameResult: string;

  @Column({ default: false })
  isExperimentAnimal?: boolean;

  @ManyToOne(() => Experiment, exp => exp.videoExperiments, {
    onDelete: 'CASCADE',
    eager: true
  })
  @JoinColumn({ name: 'experimentId' })
  experiment: Experiment;

  @ManyToOne(() => Video, v => v.videoExperiments, { nullable: true, onDelete: 'SET NULL', })
  @JoinColumn({ name: 'videoId' })
  video: Video;

  @OneToMany(() => MetricVideoExperiment, (experiment) => experiment.videoExperimentId)
  metricVideoExperiments: MetricVideoExperiment[];

  @ManyToOne(() => Status, (status) => status.videos)
  status: Status;
}
