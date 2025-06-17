import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Experiment } from '../experiment/experiment.entity';
import { VideoExperiment } from 'src/video-experiment/video-experiment.entity';
import { LabAnimal } from 'src/lab-animal/lab-animal.entity';
import { MetricVideoExperiment } from 'src/metric-video-experiment/metric-video-experiment.entity';
import { User } from 'src/user/user.entity';

@Entity()
export class Video {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    description: string;

    @Column()
    date: Date;

    @Column()
    filename: string;

    @Column({ type: 'int', nullable: true })
    durationMinutes: number;

    @Column({ type: 'int', nullable: true })
    durationSeconds: number;

    @Column({ default: false })
    isExperimentAnimal?: boolean;

    @ManyToOne(() => LabAnimal, (labAnimal) => labAnimal.videos, { nullable: true, onDelete: 'SET NULL', })
    labAnimal: LabAnimal;

    @OneToMany(() => VideoExperiment, (experiment) => experiment.video)
    videoExperiments: VideoExperiment[];

    @ManyToOne(() => User, (user) => user.videos, {onDelete: 'CASCADE'})
    user: User;
}
