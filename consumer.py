import pika
import json
from config import RABBIT_URL, QUEUE_NAME
from analyze_experiment import analyze_experiment, get_video_paths, process_video_for_metrics

def on_message(ch, method, props, body):
    print('on_message вызван')
    try:
        data = json.loads(body)
        experiment = data.get('data', {}).get('exp')

        print(data)
        if not experiment:
            print("Ошибка: данные эксперимента не найдены в сообщении.")
            ch.basic_ack(delivery_tag=method.delivery_tag)
            return

        # 1. Получить список метрик
        active_metrics = analyze_experiment(experiment)
        if not active_metrics:
            print(f"Эксперимент {experiment.get('id')}: нет подходящих метрик для анализа.")
            ch.basic_ack(delivery_tag=method.delivery_tag)
            return

        # 2. Получить пути ко всем видео
        try:
            video_paths = get_video_paths(experiment)
        except FileNotFoundError as e:
            print(f"[ОШИБКА] Видео не найдено: {e}")
            ch.basic_ack(delivery_tag=method.delivery_tag)
            return

        # 3. Запустить анализ по каждому видео
        for video_path in video_paths:
            print(f"Обработка видео: {video_path}")
            results = process_video_for_metrics(video_path, active_metrics)
            print(f"[РЕЗУЛЬТАТ] для видео {video_path}:\n", json.dumps(results, indent=4, ensure_ascii=False))

        ch.basic_ack(delivery_tag=method.delivery_tag)

    except Exception as e:
        print("[ОШИБКА] при обработке сообщения:", e)
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

def main():
    params = pika.URLParameters(RABBIT_URL)
    conn = pika.BlockingConnection(params)
    chan = conn.channel()
    chan.queue_declare(queue=QUEUE_NAME, durable=False)
    chan.basic_qos(prefetch_count=1)
    chan.basic_consume(queue=QUEUE_NAME, on_message_callback=on_message)
    print("[*] Ожидание сообщений...")
    chan.start_consuming()

if __name__ == '__main__':
    main()
