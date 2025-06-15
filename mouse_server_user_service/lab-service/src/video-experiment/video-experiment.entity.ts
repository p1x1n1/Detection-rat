import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, PrimaryColumn, JoinColumn } from 'typeorm';
import { Experiment } from '../experiment/experiment.entity';
import { Video } from 'src/video/video.entity';
import { Status } from 'src/status/status.entity';

@Entity()
export class VideoExperiment {
  @PrimaryColumn('int')
  experimentId: number;

  @PrimaryColumn('int')
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

  @ManyToOne(() => Video, v => v.videoExperiments)
  @JoinColumn({ name: 'videoId' })
  video: Video;

  @ManyToOne(() => Status, (status) => status.videos)
  status: Status;
}
