import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { Transport, MicroserviceOptions } from '@nestjs/microservices';


async function start() {
  const PORT = process.env.TASK_SERVICE_PORT || 7000;
  const app = await NestFactory.create(AppModule);

  //Подключаем микросервис
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [
        `amqp://guest:guest@localhost:5672`
      ],
      queue: 'video_analysis_response_queue',
      queueOptions: { durable: false },
    },
  });

  await app.startAllMicroservices();

  // Разрешаем CORS
  app.enableCors({
    origin: 'http://localhost:3000', //'*', // 'http://localhost:4200'
    methods: 'GET,HEAD,PATCH,POST,DELETE',
    credentials: true, // Установите true, если вы хотите разрешить отправку куки
  });

  const config = new DocumentBuilder()
    .setTitle("LabService")
    .setDescription("Лаборатория")
    .setVersion("1.0")
    .addTag('p1x1n1')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  await app.listen(PORT, () => console.log(`Starting on ${PORT}`));
}

start()
