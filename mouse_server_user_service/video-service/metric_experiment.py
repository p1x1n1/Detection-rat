# metrics_client.py

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from config import DB_URL

# Настраиваем движок и сессию
engine = create_engine(DB_URL)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

def fetch_metrics(video_id: str):
    """
    Вызывает в БД функцию getMetric(id) и возвращает результат как список словарей.
    """
    session = SessionLocal()
    try:
        # Вызываем функцию getMetric, передаём параметр :id
        stmt = text("SELECT * FROM getMetric(:id)")
        result = session.execute(stmt, {"id": video_id})

        # Для современного SQLAlchemy рекомендую .mappings(), чтобы получить dict-like объекты
        rows = result.mappings().all()
        return rows  # список dict, ключи — имена полей, возвращаемых функцией

    finally:
        session.close()
