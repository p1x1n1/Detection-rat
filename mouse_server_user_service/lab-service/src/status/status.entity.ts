import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Experiment } from '../experiment/experiment.entity';
import { VideoExperiment } from 'src/video-experiment/video-experiment.entity';

@Entity()
export class Status {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  statusName: string;

  @OneToMany(() => Experiment, (experiment) => experiment.status)
  experiments: Experiment[];

  @OneToMany(() => VideoExperiment, (video) => video.status)
  videos: VideoExperiment[];
}
