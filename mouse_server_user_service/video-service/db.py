# db.py
from sqlalchemy import create_engine, Column, String, Text, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import DB_URL

# Настраиваем движок и сессию
engine = create_engine(DB_URL)
SessionLocal = sessionmaker(bind=engine)

# Базовый класс с reflection
metadata = MetaData()
Base = declarative_base(metadata=metadata)

class Video(Base):
    __tablename__ = 'video'
    __table_args__ = {'autoload_with': engine}
    # Колонки нужно объявить так, чтобы они совпадали с теми, что уже есть в БД:
    id     = Column(String, primary_key=True)
    path   = Column(String)
    status = Column(String)
    result = Column(Text)
