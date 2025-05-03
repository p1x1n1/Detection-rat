from dotenv import load_dotenv
import os

load_dotenv()

# RabbitMQ
RABBIT_URL = (
    f"amqp://{os.getenv('RABBIT_USER','guest')}:"
    f"{os.getenv('RABBIT_PASS','guest')}@"
    f"{os.getenv('RABBIT_HOST')}:{os.getenv('RABBIT_PORT')}/"
)

# Postgres
db_user = os.getenv('LAB_POSTGRES_USER')
db_pass = os.getenv('LAB_POSTGRES_PASSWORD')
db_host = os.getenv('LAB_POSTGRES_HOST')
db_port = os.getenv('LAB_POSTGRES_PORT')
db_name = os.getenv('LAB_POSTGRES_DB')

DB_URL = (
    f"postgresql+psycopg2://{db_user}:{db_pass}@"
    f"{db_host}:{db_port}/{db_name}"
)

QUEUE_NAME = 'video_analysis_queue'
