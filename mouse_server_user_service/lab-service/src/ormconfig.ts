import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Metric } from './metric/metric.entity';
import { Role } from './role/role.entity';
import { User } from './user/user.entity';
import { Video } from './video/video.entity';
import { Status } from './status/status.entity';
import { MetricExperiment } from './metric-experiment/metric-experiment.entity';
import { Color } from './color/color.entity';
import { LabAnimal } from './lab-animal/lab-animal.entity';
import { Experiment } from './experiment/experiment.entity';
import { VideoExperiment } from './video-experiment/video-experiment.entity';
import { MetricVideoExperiment } from './metric-video-experiment/metric-video-experiment.entity';


dotenv.config({
    path: `.${process.env.NODE_ENV}.env`,
  });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.LAB_POSTGRES_HOST,
  port: Number(process.env.LAB_POSTGRES_PORT),
  username: "postgres",
  password: "040104",
  database: "lab_db",
  entities: [User, Role, Video, Status, Metric, MetricExperiment, Experiment, Color, LabAnimal, VideoExperiment, MetricVideoExperiment],
  migrations: ['dist/migrations/*.js'],  
  synchronize: false, 
  logging: true,
});

AppDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized!");
  })
  .catch((err) => {
    console.error("Error during Data Source initialization", err);
  });