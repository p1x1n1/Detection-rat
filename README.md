# Detection-rat

Система для анализа поведения лабораторных мышей по видеозаписям экспериментов.

Архитектура:

- **Клиент** — React SPA (`mouse_client`), интерфейс для пользователей лаборатории.
- **Сервер** — NestJS-сервис `lab-service` (`mouse_server_user_service/lab-service`): REST API, хранение данных в PostgreSQL, выдача статусов, генерация отчётов, работа с RabbitMQ.
             — Python-сервис `video-service` (`mouse_server_user_service/video-service`): асинхронный воркер, который слушает очередь RabbitMQ, анализирует видео с помощью YOLO + OpenCV и отдаёт результаты обратно в `lab-service`.

Связь между сервисами идёт через RabbitMQ (паттерны сообщений `video.analyze`, `video.analyze.*`).

---

## Основные возможности

- управление пользователями и ролями;
- загрузка и хранение видеоэкспериментов;
- описание животных (мышей), цветов, статусов и метрик;
- создание экспериментов:
  - выбор набора видео,
  - выбор метрик с промежутками времени;
- запуск и остановка анализа экспериментов;
- отслеживание статусов анализа по каждому видео;
- сохранение результатов метрик по видео;
- выгрузка отчёта по эксперименту в формате **Excel**.


Запуск клиента 
```
cd mouse_client
npm run start
```

Запуск сервера взаимодействия с  пользователем
```
cd mouse_server_user_service\lab-service
npm run start:dev
```

```
cd mouse_server_user_service\video-service
.\venv\Scripts\Activate.ps1
python .\consumer.py
```


**Клиент (`mouse_client`) - SPA на React 18 c использованием:**

- `react-router-dom` — роутинг;
- `mobx-react-lite` — состояние пользователя и сессии;
- `antd` / `react-bootstrap` — UI-компоненты;
- e2e-тесты на `mocha` + `selenium-webdriver`, мок-сервер на `msw`.  

Адрес API задаётся переменной окружения:

```bash
REACT_APP_API_URL=http://localhost:7000
```

По умолчанию клиент использует http://localhost:7000 как базовый URL.

Приложение:

    даёт формы регистрации/логина;

    позволяет управлять видео, экспериментами, метриками, животными;

    показывает статусы экспериментов и прогресс анализа;

    даёт скачать Excel-отчёт.


**lab-service (NestJS, PostgreSQL, RabbitMQ)**

Путь: mouse_server_user_service/lab-service

Основные технологии:

NestJS 10 (@nestjs/common, @nestjs/core, @nestjs/swagger);

PostgreSQL + TypeORM;

RabbitMQ через @nestjs/microservices и amqp-connection-manager;

раздача статических файлов (ServeStaticModule) — видеоролики и результаты анализа;

Swagger-документация по адресу http://localhost:7000/api/docs.

Основные сущности (TypeORM)

User, Role — пользователи и роли.

Video — видеофайлы экспериментов.

Status — статус видео и эксперимента (создан, в очереди, в процессе, завершён, ошибка и т.п.).

Metric — тип метрики (заглядывание в нору, стойки, дефекации, время в секторах и др.).

Experiment — эксперимент в целом.

MetricExperiment — привязка метрики к эксперименту с интервалами времени.

VideoExperiment — привязка видео к эксперименту + статус и ссылка на результирующее видео.

MetricVideoExperiment — значение метрики по конкретному видео в эксперименте.

Основные модули

AuthModule — JWT-авторизация, защита эндпоинтов через AuthGuard('jwt').

UserModule — управление пользователями (создание, обновление, аватарки).

VideoModule — загрузка и управление видеороликами.

ExperimentModule — создание/чтение/удаление экспериментов и запуск анализа.

Metric*-модули — управление метриками и их связями.

StatusModule — справочник статусов.

FileModule — сохранение файлов в static/.

Работа с RabbitMQ

В main.ts Nest-приложение поднимает HTTP-сервер и подключает микросервис RMQ:

очередь ответов: video_analysis_response_queue (по умолчанию);

подключение к amqp://guest:guest@localhost:5672.

Сервис экспериментов (ExperimentService):

при GET /experiment/analyze/:id:

обновляет статус эксперимента (например, "Анализ");

переводит связанные VideoExperiment в статус "В очереди";

отправляет событие video.analyze в RabbitMQ с объектом эксперимента (exp).

при GET /experiment/stopAnalyze/:id:

переводит эксперимент и его видео в статус "Анализ прекращен";

отправляет событие video.analyze.stopped.

Контроллер экспериментов (ExperimentController) подписан на события:

video.analyze.completed — результаты метрик по видео;

video.analyze.processed — видео перешло в статус "В процессе";

video.analyze.error — ошибка обработки видео;

video.analyze.stopped — анализ остановлен.

Excel-отчёт: GET /experiment/:id/report/excel
Формируется Workbook с заголовками и строками по каждому видео+животному, по всем метрикам, и возвращается как .xlsx.


**video-service (Python, YOLO, OpenCV, RabbitMQ)**

Путь: mouse_server_user_service/video-service

Назначение: асинхронный воркер, который:

Слушает очередь RabbitMQ video_analysis_queue.

Получает сообщение {"pattern": "video.analyze", "data": {"exp": {...}}}.

По описанию эксперимента:

определяет, какие метрики нужно считать;

ищет пути к видео в ../lab-service/static/videos.

По каждому видео:

запускает обработку в отдельной async-таске (ограничение одновременных задач — через asyncio.Semaphore).

считает метрики по кадрам.

Отправляет события обратно в очередь ответов video_analysis_response_queue:

video.analyze.processed — видео взято в обработку;

video.analyze.completed — обработка видео завершена, отданы значения метрик;

video.analyze.error — ошибка обработки;

video.analyze.stopped — обработка остановлена.

Конфигурация (config.py)

Используются переменные окружения:

RabbitMQ:

RABBIT_USER / RABBIT_PASS (по умолчанию guest/guest);

RABBIT_HOST, RABBIT_PORT;

QUEUE_NAME — очередь заданий (по умолчанию video_analysis_queue);

RESPONSE_QUEUE — очередь ответов (по умолчанию video_analysis_response_queue).

PostgreSQL (та же база, что у lab-service):

LAB_POSTGRES_USER

LAB_POSTGRES_PASSWORD

LAB_POSTGRES_HOST

LAB_POSTGRES_PORT

LAB_POSTGRES_DB

Основные компоненты анализа (analyze_experiment.py)

YOLO-модели (ultralytics.YOLO) для распознавания:

mouse, hole_peek, rearing, grooming, defecation, а также ROI (roi).

Подсчёт:

количества пересечений горизонтальных/вертикальных линий;

количества заглядываний в отверстия;

количества стоек (rearing);

количества эпизодов груминга;

количества дефекаций;

времени нахождения мыши в центральном и периферическом секторах лабиринта.

Поддержка:

загрузки маски (mask.png) и аннотаций (mask_annotations.json);

автоматического подбора ROI;

трансформации аннотированных окружностей/линий под реальные кадры видео.
