import asyncio
import json
from config import RABBIT_URL, QUEUE_NAME, RESPONSE_QUEUE
from analyze_experiment import analyze_experiment, get_video_paths, process_video_for_metrics
import aio_pika

# Ограничим до 4 одновременных задач
SEMAPHORE = asyncio.Semaphore(3)

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
            results = await loop.run_in_executor(None, process_video_for_metrics, exp_id, video_path, metrics)

            print(f"[RESULT] {video_path} → {results}")

            # Событие завершения
            await publish_event('video.analyze.completed', {
                'expId': exp_id,
                'videoPath': video_path,
                'metrics': results
            })
        except Exception as err:
            publish_event('video.analyze.error', {
                'expId': exp_id,
                'videoPath': video_path,
                'error': err })

async def handle_message(body: bytes):
    try:
        msg = json.loads(body)
        experiment = msg.get('data', {}).get('exp')
        if not experiment:
            print("[!] Нет данных эксперимента в сообщении")
            return

        exp_id = experiment.get('id')
        metrics = analyze_experiment(experiment)
        if not metrics:
            print(f"[!] Эксперимент {exp_id}: нет метрик")
            return

        try:
            video_paths = get_video_paths(experiment)
        except FileNotFoundError as e:
            print(f"[ERROR] Видео не найдено: {e}")
            return

        # запускаем все видео параллельно
        await asyncio.gather(*[
            handle_video(exp_id, video_path, metrics)
            for video_path in video_paths
        ])

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
