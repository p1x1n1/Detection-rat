import threading
import pika
import json
from config import RABBIT_URL, QUEUE_NAME, RESPONSE_QUEUE
from analyze_experiment import (
    analyze_experiment,
    get_video_paths,
    process_video_for_metrics,
)

def publish_response(exp_id: int, video_path: str, metrics: dict):
    """
    Открывает своё соединение и шлёт сообщение в очередь ответов.
    """
    params = pika.URLParameters(RABBIT_URL)
    params.heartbeat = 0
    conn = pika.BlockingConnection(params)
    ch = conn.channel()
    ch.queue_declare(queue=RESPONSE_QUEUE, durable=False)

    payload = {
        'pattern': 'video.analyze.completed',
        'data': {
            'expId': exp_id,
            'videoPath': video_path,
            'metrics': metrics
        }
    }
    ch.basic_publish(
        exchange='',
        routing_key=RESPONSE_QUEUE,
        body=json.dumps(payload, ensure_ascii=False)
    )
    conn.close()

def publish_processed_event(exp_id: int, video_path: str):
    """
    Отправляет событие о том, что анализ видео начат.
    """
    params = pika.URLParameters(RABBIT_URL)
    params.heartbeat = 0
    conn = pika.BlockingConnection(params)
    ch = conn.channel()
    ch.queue_declare(queue=RESPONSE_QUEUE, durable=False)

    payload = {
        'pattern': 'video.analyze.processed',
        'data': {
            'expId': exp_id,
            'videoPath': video_path
        }
    }

    ch.basic_publish(
        exchange='',
        routing_key=RESPONSE_QUEUE,
        body=json.dumps(payload, ensure_ascii=False)
    )
    conn.close()

def handle_message(body: bytes):
    """
    Фоновая обработка одного сообщения: анализ + публикация ответов.
    """
    try:
        msg = json.loads(body)
        experiment = msg.get('data', {}).get('exp')
        if not experiment:
            print("[!] Нет данных эксперимента в сообщении")
            return

        exp_id = experiment.get('id')
        active_metrics = analyze_experiment(experiment)
        if not active_metrics:
            print(f"[!] Эксперимент {exp_id}: нет метрик для анализа")
            return

        try:
            video_paths = get_video_paths(experiment)
        except FileNotFoundError as e:
            print(f"[ERROR] Видео не найдено: {e}")
            return

        for video_path in video_paths:
            print(f"[*] Анализ видео: {video_path}")

            #  Событие начала анализа
            publish_processed_event(exp_id, video_path)

            results = process_video_for_metrics(video_path, active_metrics)
            print(f"[RESULT] {video_path} → {results}")

            #  Событие завершения анализа
            publish_response(exp_id, video_path, results)

    except Exception as e:
        print(f"[ERROR] при фоновом анализе: {e}")

def on_message(ch, method, props, body):
    # 1) подтверждаем приём сразу
    ch.basic_ack(delivery_tag=method.delivery_tag)
    # 2) запускаем тяжёлую работу в фоне
    thread = threading.Thread(
        target=handle_message,
        args=(body,),
        daemon=True
    )
    thread.start()

def main():
    # Отключаем heartbeat на основном соединении
    params = pika.URLParameters(RABBIT_URL)
    params.heartbeat = 0

    conn = pika.BlockingConnection(params)
    ch = conn.channel()

    # объявляем очереди
    ch.queue_declare(queue=QUEUE_NAME, durable=False)
    ch.queue_declare(queue=RESPONSE_QUEUE, durable=False)

    ch.basic_qos(prefetch_count=1)
    ch.basic_consume(queue=QUEUE_NAME, on_message_callback=on_message)

    print(f"[*] Ожидание сообщений в очереди «{QUEUE_NAME}» …")
    try:
        ch.start_consuming()
    except KeyboardInterrupt:
        print("Прерывание работы, завершаем…")
        ch.stop_consuming()
    finally:
        conn.close()

if __name__ == '__main__':
    main()
