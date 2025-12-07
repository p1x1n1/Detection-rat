# Detection-rat

Система для анализа поведения лабораторных мышей по видеозаписям экспериментов.

Архитектура:

- **Клиент** — React SPA (`mouse_client`), интерфейс для пользователей лаборатории.  
- **Серверы**:  
  - **lab-service** — NestJS (`mouse_server_user_service/lab-service`): REST API, PostgreSQL, статусы, отчёты, взаимодействие с RabbitMQ;  
  - **video-service** — Python (`mouse_server_user_service/video-service`): асинхронный воркер, анализирующий видео с помощью YOLO + OpenCV и отправляющий результаты обратно в `lab-service`.

Связь между сервисами осуществляется через RabbitMQ  
(`video.analyze`, `video.analyze.*`).

---

## Основные возможности

- управление пользователями и ролями;
- загрузка и хранение видеоматериалов;
- описание животных (мышей), цветов, статусов и метрик;
- создание экспериментов:
  - выбор набора видео;
  - выбор метрик и временных промежутков;
- запуск и остановка анализа;
- статус трекинг всех видео в эксперименте;
- сохранение результатов;
- генерация Excel-отчёта.

---

# Запуск

### Клиент
```bash
cd mouse_client
npm run start
````

### Сервер взаимодействия с пользователем (NestJS)

```bash
cd mouse_server_user_service/lab-service
npm run start:dev
```

### Видео-сервис (Python)

```bash
cd mouse_server_user_service/video-service
.\venv\Scripts\Activate.ps1
python .\consumer.py
```

---

# Клиент (`mouse_client`)

SPA на **React 18**, использует:

* `react-router-dom` — роутинг;
* `mobx-react-lite` — хранилище состояния;
* `antd` / `react-bootstrap` — UI;
* тесты на `mocha` + `selenium-webdriver`, мок-сервер на `msw`.

API-адрес задаётся переменной:

```bash
REACT_APP_API_URL=http://localhost:7000
```

По умолчанию — `http://localhost:7000`.

Функциональность клиента:

* регистрация/логин;
* загрузка видео и управление ими;
* создание и управление экспериментами;
* выбор метрик;
* наблюдение статусов анализа;
* скачивание Excel-отчёта.

---

# **lab-service** (NestJS, PostgreSQL, RabbitMQ)

**Путь:** `mouse_server_user_service/lab-service`

Основные технологии:

* **NestJS 10**
* **PostgreSQL + TypeORM**
* RabbitMQ (`@nestjs/microservices`, `amqp-connection-manager`)
* Раздача статических файлов (видео, результаты)
* Swagger: **[http://localhost:7000/api/docs](http://localhost:7000/api/docs)**

---

## Основные сущности (TypeORM)

* **User**, **Role** — пользователи и роли
* **Video** — видеозаписи экспериментов
* **Status** — статус видео и эксперимента
* **Metric** — тип метрики
* **Experiment** — описание эксперимента
* **MetricExperiment** — метрика + время начала/конца
* **VideoExperiment** — связь видео с экспериментом
* **MetricVideoExperiment** — рассчитанные результаты метрик

---

## Основные модули NestJS

* **AuthModule** — JWT-авторизация
* **UserModule** — управление пользователями и аватарами
* **VideoModule** — загрузка и хранение видео
* **ExperimentModule** — создание, запуск, остановка, получение результатов
* **Metric*** — модули для работы с метриками
* **StatusModule** — статусы системы
* **FileModule** — статические файлы (`static/`)

---

## Взаимодействие с RabbitMQ

`main.ts` поднимает:

* HTTP-сервер (`7000`)
* RMQ-микросервис, слушающий очередь:

  * **video_analysis_response_queue**

### Отправка задач на анализ

`GET /experiment/analyze/:id`:

* эксперимент получает статус *"Анализ"*
* видео → *"В очереди"*
* в RabbitMQ отправляется событие:

```json
{
  "pattern": "video.analyze",
  "data": { "exp": { ... } }
}
```

### Остановка анализа

`GET /experiment/stopAnalyze/:id`:

* статусы → "Анализ прекращён"
* RMQ-событие `video.analyze.stopped`

### Подписка на ответы из RabbitMQ

`ExperimentController` слушает:

* `video.analyze.completed` — видео обработано, метрики готовы
* `video.analyze.processed` — видео взято в работу
* `video.analyze.error` — ошибка обработки
* `video.analyze.stopped` — обработка остановлена

### Excel-отчёт

`GET /experiment/:id/report/excel` — возвращает сформированный `.xlsx`.

---

# **video-service** (Python, YOLO, OpenCV, RabbitMQ)

**Путь:** `mouse_server_user_service/video-service`

Назначение — асинхронный обработчик видео:

1. Слушает очередь **video_analysis_queue**
2. Получает задачу `video.analyze` → список видео + метрики
3. Обрабатывает каждое видео:

   * запускает отдельную async-таску
   * ограничивает параллелизм через `asyncio.Semaphore`
4. Считает метрики:

   * заглядывания в нору
   * стойки (rearing)
   * груминг
   * дефекации
   * время в ROI
   * пересечения линий
5. Отправляет результаты в **video_analysis_response_queue**

---

## Конфигурация (config.py)

Используются переменные окружения:

### RabbitMQ

```
RABBIT_USER
RABBIT_PASS
RABBIT_HOST
RABBIT_PORT
QUEUE_NAME             # video_analysis_queue
RESPONSE_QUEUE         # video_analysis_response_queue
```

### PostgreSQL (та же база, что у lab-service)

```
LAB_POSTGRES_USER
LAB_POSTGRES_PASSWORD
LAB_POSTGRES_HOST
LAB_POSTGRES_PORT
LAB_POSTGRES_DB
```

---

## Основные компоненты анализа (`analyze_experiment.py`)

Используются модели YOLO (`ultralytics.YOLO`) для распознавания:

* `mouse`
* `hole_peek`
* `rearing`
* `grooming`
* `defecation`
* `roi`

Поддерживаются:

* маска (`mask.png`)
* аннотации (`mask_annotations.json`)
* трансформация координат линий и областей под реальные кадры

### Считаемые метрики:

* пересечения горизонтальных линий
* пересечения вертикальных линий
* заглядывания в отверстия
* стойки (rearing)
* эпизоды груминга
* дефекации
* время в центральной и периферической зоне



