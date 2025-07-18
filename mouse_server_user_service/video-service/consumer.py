import asyncio
import json
from config import RABBIT_URL, QUEUE_NAME, RESPONSE_QUEUE
from analyze_experiment import analyze_experiment, get_video_paths, process_video_for_metrics
import aio_pika
from collections import defaultdict
# Ограничим до 3 одновременных задач
SEMAPHORE = asyncio.Semaphore(3)

# tasks_map хранит для каждого exp_id словарь { video_path: asyncio.Task }
tasks_map = defaultdict(dict)

async def publish_event(pattern: str, payload: dict):
    connection = await aio_pika.connect_robust(RABBIT_URL)
    async with connection:
        channel = await connection.channel()
        await channel.declare_queue(RESPONSE_QUEUE, durable=False)

        message = aio_pika.Message(
            body=json.dumps({
                'pattern': pattern,
                'data': payload
            }, ensure_ascii=False).encode()
        )
        await channel.default_exchange.publish(message, routing_key=RESPONSE_QUEUE)

async def handle_video(exp_id: int, video_path: str, metrics: dict):
    async with SEMAPHORE:
        try:
            print(f"[START] Анализ: {video_path}")

            # Событие начала анализа
            await publish_event('video.analyze.processed', {
                'expId': exp_id,
                'videoPath': video_path,
            })

            # Выполняем анализ (блокирующий код можно обернуть в executor)
            loop = asyncio.get_event_loop()
             # обёртка для отмены
            results = await loop.run_in_executor(None, process_video_for_metrics, exp_id, video_path, metrics) 

            print(f"[RESULT] {video_path} → {results}")

            # Событие завершения
            await publish_event('video.analyze.completed', {
                'expId': exp_id,
                'videoPath': video_path,
                'metrics': results
            })
        except asyncio.CancelledError:
            # если таска отменили — посылаем стоп-сигнал
            await publish_event('video.analyze.stopped', {
                'expId': exp_id,
                'videoPath': video_path,

            })
            raise
        except Exception as err:
            publish_event('video.analyze.error', {
                'expId': exp_id,
                'videoPath': video_path,
                'error': err })

async def stop_analysis(exp_id: int):
    # Отмена всех тасок по данному exp_id
     for path, task in tasks_map.get(exp_id, {}).items():
         if not task.done():
             task.cancel()
             # само handle_video отправит видео.analyze.stopped при отмене
     tasks_map.pop(exp_id, None)

async def handle_message(body: bytes):
    try:
        msg = json.loads(body)
        pattern = msg.get('pattern')
        experiment = msg.get('data', {}).get('exp')
        if not experiment:
            print("[!] Нет данных эксперимента в сообщении")
            return

        # Старт анализа
        if pattern == 'video.analyze':
            exp_id  = experiment['id']
            metrics = analyze_experiment(experiment)
            if not metrics:
                print(f"[!] Эксперимент {exp_id}: нет метрик")
                return
            try:
                video_paths = get_video_paths(experiment)
            except FileNotFoundError as e:
                print(f"[ERROR] Видео не найдено: {e}")
                return

            # создаём и запускаем таски — но не ждём их тут!
            for video_path in video_paths:
                task = asyncio.create_task(handle_video(exp_id, video_path, metrics))
                tasks_map[exp_id][video_path] = task
            print(f"[LAUNCHED] {len(video_paths)} задач для exp {exp_id}")
            return

        # Команда остановки
        if pattern == 'video.analyze.stopped':
            exp_id = experiment['id']
            print(f"[STOP CMD] exp={exp_id}")
            await stop_analysis(exp_id)
            return

    except Exception as e:
        print(f"[ERROR] при анализе: {e}")

async def main():
    connection = await aio_pika.connect_robust(RABBIT_URL)
    channel = await connection.channel()
    await channel.set_qos(prefetch_count=1)
    queue = await channel.declare_queue(QUEUE_NAME, durable=False)

    print(f"[*] Ожидание сообщений в очереди «{QUEUE_NAME}»...")

    async with queue.iterator() as queue_iter:
        async for message in queue_iter:
            async with message.process():
                await handle_message(message.body)

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("⏹ Прерывание вручную. Выход...")
