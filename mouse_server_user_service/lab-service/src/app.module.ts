import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClientsModule, Transport } from '@nestjs/microservices';
import { User } from "./user/user.entity";
import { Role } from "./role/role.entity";
import { Video } from "./video/video.entity";
import { Status } from "./status/status.entity";
import { Metric } from "./metric/metric.entity";
import { MetricExperiment } from "./metric-experiment/metric-experiment.entity";
import { Experiment } from "./experiment/experiment.entity";
import { Color } from "./color/color.entity";
import { LabAnimal } from "./lab-animal/lab-animal.entity";
import { UserModule } from './user/user.module';
import { RoleModule } from './role/role.module';
import { LabAnimalModule } from './lab-animal/lab-animal.module';
import { ColorModule } from './color/color.module';
import { VideoModule } from './video/video.module';
import { StatusModule } from './status/status.module';
import { MetricModule } from './metric/metric.module';
import { ExperimentModule } from './experiment/experiment.module';
import { MetricExperimentModule } from './metric-experiment/metric-experiment.module';
import { AuthModule } from './auth/auth.module';
import { FileService } from './file/file.service';
import { FileModule } from './file/file.module';
import { VideoExperimentModule } from './video-experiment/video-experiment.module';
import { VideoExperiment } from "./video-experiment/video-experiment.entity";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import { MetricVideoExperimentModule } from './metric-video-experiment/metric-video-experiment.module';
import { MetricVideoExperiment } from "./metric-video-experiment/metric-video-experiment.entity";

@Module({
  controllers: [AppController],
  providers: [AppService, FileService],
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.${process.env.NODE_ENV}.env`
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'static'),
      serveRoot: '/static',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.LAB_POSTGRES_HOST,
      port: Number(process.env.LAB_POSTGRES_PORT),
      username: process.env.LAB_POSTGRES_USER,
      password: process.env.LAB_POSTGRES_PASSWORD,
      database: process.env.LAB_POSTGRES_DB,
      entities: [User, Role, Video, Status, Metric, MetricExperiment, Experiment, Color, LabAnimal, VideoExperiment, MetricVideoExperiment],
      synchronize: true
    }),
    UserModule, RoleModule, LabAnimalModule, ColorModule, VideoModule, StatusModule, MetricModule, ExperimentModule, MetricExperimentModule, AuthModule, FileModule, VideoExperimentModule, MetricVideoExperimentModule,
  ],
})
export class AppModule {

}